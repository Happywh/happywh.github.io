import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from './lib/supabase'
import './Reconciliator.css'

function ReconciliatorTrip() {

  const { tripId } = useParams()

  /* =========================
     TRIP
  ========================= */

  const [tripName, setTripName] = useState('')
  const [loading, setLoading] = useState(true)


  /* =========================
     PEOPLE
  ========================= */

  const [people, setPeople] = useState([])
  const [newPerson, setNewPerson] = useState('')
  const [personToRemove, setPersonToRemove] = useState(null)


  /* =========================
     EXPENSES
  ========================= */

  const [expenses, setExpenses] = useState([])

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState('')

  // People included in current expense
  const [splitBetween, setSplitBetween] = useState([])


  /* =========================
     LOAD TRIP
  ========================= */

  useEffect(() => {

    async function loadTrip() {

      setLoading(true)

      // Load trip
      const {
        data: trip,
        error: tripError
      } = await supabase
        .from('trips')
        .select('name')
        .eq('id', tripId)
        .single()

      if (tripError) {

        console.error(
          'Error loading trip:',
          tripError
        )

        setLoading(false)
        return
      }

      setTripName(trip.name)


      // Load people
      const {
        data: peopleData,
        error: peopleError
      } = await supabase
        .from('trip_people')
        .select('id, name')
        .eq('trip_id', tripId)
        .order('created_at', {
          ascending: true
        })

      if (peopleError) {

        console.error(
          'Error loading people:',
          peopleError
        )

        setLoading(false)
        return
      }

      setPeople(peopleData || [])
    
    //Load expenses
    const {
        data: expenseData,
        error: expenseError
      } = await supabase
        .from('expenses')
        .select(`
          id,
          description,
          amount,
          paid_by,
          expense_people (
            person_id
          )
        `)
        .eq('trip_id', tripId)
        .order('created_at', {
          ascending: true
        })


      if (expenseError) {

        console.error(
          'Error loading expenses:',
          expenseError
        )

      } else {

        const formattedExpenses =
          (expenseData || []).map(expense => ({
            id: expense.id,
            description: expense.description,
            amount: Number(expense.amount),
            paidBy: expense.paid_by,

            splitBetween:
              expense.expense_people.map(
                person =>
                  person.person_id
              )
          }))

        setExpenses(formattedExpenses)
      }

    setLoading(false)
    }

    loadTrip()

  }, [tripId])


  /* =========================
     PEOPLE
  ========================= */

  async function addPerson(e) {

    e.preventDefault()

    const name = newPerson.trim()

    if (!name) return


    // Prevent duplicate names
    const alreadyExists = people.some(
      person =>
        person.name.toLowerCase() ===
        name.toLowerCase()
    )

    if (alreadyExists) {
      return
    }


    const {
      data,
      error
    } = await supabase
      .from('trip_people')
      .insert({
        trip_id: tripId,
        name: name
      })
      .select('id, name')
      .single()


    if (error) {

      console.error(
        'Error adding person:',
        error
      )

      alert(
        `Error adding person: ${error.message}`
      )

      return
    }


    setPeople(prev => [
      ...prev,
      data
    ])

    setNewPerson('')


    // Automatically select the first person
    // as the payer
    if (!paidBy) {
      setPaidBy(data.id)
    }


    // Add the new person to the default
    // split list
    setSplitBetween(prev => [
      ...prev,
      data.id
    ])
  }


  async function removePerson(personId) {

    const {
      error
    } = await supabase
      .from('trip_people')
      .delete()
      .eq('id', personId)


    if (error) {

      console.error(
        'Error removing person:',
        error
      )

      alert(
        `Error removing person: ${error.message}`
      )

      return
    }


    setPeople(prev =>
      prev.filter(
        person =>
          person.id !== personId
      )
    )


    if (paidBy === personId) {
      setPaidBy('')
    }


    setSplitBetween(prev =>
      prev.filter(
        id => id !== personId
      )
    )
    await loadTrip()
  }


  /* =========================
     EXPENSE SPLIT
  ========================= */

  function togglePerson(personId) {

    if (
      splitBetween.includes(personId)
    ) {

      setSplitBetween(
        splitBetween.filter(
          id => id !== personId
        )
      )

    } else {

      setSplitBetween([
        ...splitBetween,
        personId
      ])
    }
  }


  function selectEveryone() {

    setSplitBetween(
      people.map(person => person.id)
    )
  }


  function clearEveryone() {

    setSplitBetween([])
  }


  /* =========================
     EXPENSES
  ========================= */

  async function addExpense(e) {
    e.preventDefault()

    if (!description.trim()) return

    if (!amount || Number(amount) <= 0) return

    if (!paidBy) return

    if (splitBetween.length === 0) return


    // Create the expense
    const {
      data: expense,
      error: expenseError
    } = await supabase
      .from('expenses')
      .insert({
        trip_id: tripId,
        description: description.trim(),
        amount: Number(amount),
        paid_by: paidBy
      })
      .select()
      .single()


    if (expenseError) {
      console.error(
        'Error adding expense:',
        expenseError
      )

      alert(
        `Error adding expense: ${expenseError.message}`
      )

      return
    }


    // Add everyone included in the split
    const expensePeople =
      splitBetween.map(personId => ({
        expense_id: expense.id,
        person_id: personId
      }))


    const {
      error: splitError
    } = await supabase
      .from('expense_people')
      .insert(expensePeople)


    if (splitError) {

      console.error(
        'Error adding expense split:',
        splitError
      )

      // Remove the expense if the split failed
      await supabase
        .from('expenses')
        .delete()
        .eq('id', expense.id)

      alert(
        `Error adding expense split: ${splitError.message}`
      )

      return
    }


    // Add to local state
    setExpenses(prev => [
      ...prev,
      {
        id: expense.id,
        description: expense.description,
        amount: Number(expense.amount),
        paidBy: expense.paid_by,
        splitBetween: [...splitBetween]
      }
    ])


    // Reset form
    setDescription('')
    setAmount('')


    // Default to everyone for next expense
    setSplitBetween(
      people.map(person => person.id)
    )
  }

  async function removeExpense(id) {

    const {
      error
    } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)


    if (error) {

      console.error(
        'Error removing expense:',
        error
      )

      alert(
        `Error removing expense: ${error.message}`
      )

      return
    }

    setExpenses(prev =>
      prev.filter(
        expense =>
          expense.id !== id
      )
    )
    await loadTrip()
  }


  /* =========================
     TOTAL
  ========================= */

  const total =
    expenses.reduce(
      (sum, expense) =>
        sum + expense.amount,
      0
    )


  /* =========================
     BALANCES
  ========================= */

  const balances =
    people.map(person => {

      let paid = 0
      let share = 0


      expenses.forEach(
        expense => {

          // Amount this person paid
          if (
            expense.paidBy ===
            person.id
          ) {

            paid +=
              expense.amount
          }


          // Amount this person owes
          if (
            expense.splitBetween.includes(
              person.id
            )
          ) {

            share +=
              expense.amount /
              expense.splitBetween.length
          }

        }
      )


      return {

        person:
          person.name,

        personId:
          person.id,

        paid,

        share,

        balance:
          paid - share
      }
    })


  /* =========================
     SETTLEMENT
  ========================= */

  function calculateSettlements() {

    const creditors =
      balances
        .filter(
          person =>
            person.balance >
            0.005
        )
        .map(person => ({
          person:
            person.person,

          amount:
            person.balance
        }))


    const debtors =
      balances
        .filter(
          person =>
            person.balance <
            -0.005
        )
        .map(person => ({
          person:
            person.person,

          amount:
            Math.abs(
              person.balance
            )
        }))


    const settlements = []


    let creditorIndex = 0
    let debtorIndex = 0


    while (
      creditorIndex <
        creditors.length &&
      debtorIndex <
        debtors.length
    ) {

      const creditor =
        creditors[
          creditorIndex
        ]

      const debtor =
        debtors[
          debtorIndex
        ]


      const settlementAmount =
        Math.min(
          creditor.amount,
          debtor.amount
        )


      settlements.push({

        from:
          debtor.person,

        to:
          creditor.person,

        amount:
          settlementAmount
      })


      creditor.amount -=
        settlementAmount

      debtor.amount -=
        settlementAmount


      if (
        creditor.amount <
        0.005
      ) {

        creditorIndex++
      }


      if (
        debtor.amount <
        0.005
      ) {

        debtorIndex++
      }
    }


    return settlements
  }


  const settlements =
    calculateSettlements()


  /* =========================
     LOADING
  ========================= */

  if (loading) {

    return (

      <div className="reconciliator-page">

        <div className="reconciliator-container">

          <p className="reconciliator-muted">
            Loading trip...
          </p>

        </div>

      </div>
    )
  }


  /* =========================
     PAGE
  ========================= */

  return (

    <div className="reconciliator-page">

      <div className="reconciliator-container">


        {/* =========================
            HEADER
        ========================= */}

        <header className="reconciliator-header">

          <p className="reconciliator-eyebrow">
            04 — TOOLS / RECONCILIATOR
          </p>

          <h1 className="reconciliator-title">
            Reconciliator.
          </h1>

          <p className="reconciliator-description">
            Track shared expenses and work out
            who owes who at the end.
          </p>

          <Link
            to="/reconciliator"
            className="reconciliator-back"
          >
            ← Back to trips
          </Link>

        </header>


        {/* =========================
            TRIP
        ========================= */}

        <section className="reconciliator-section">

          <p className="reconciliator-section-label">
            01 — TRIP
          </p>

          <h2 className="reconciliator-trip-name">
            {tripName}
          </h2>

        </section>


        {/* =========================
            PEOPLE
        ========================= */}

        <section className="reconciliator-section">

          <p className="reconciliator-section-label">
            02 — PEOPLE
          </p>


          <form
            className="reconciliator-inline-form"
            onSubmit={addPerson}
          >

            <input
              className="reconciliator-input"
              type="text"
              placeholder="Person's name"
              value={newPerson}
              onChange={
                e =>
                  setNewPerson(
                    e.target.value
                  )
              }
            />


            <button
              className="reconciliator-button"
              type="submit"
            >
              Add person
            </button>

          </form>


          {people.length > 0 && (

            <div className="people-list">

              {people.map(person => (

                <div
                  className="person"
                  key={person.id}
                >

                  <span>
                    {person.name}
                  </span>


                  <button
                    onClick={() =>
                      setPersonToRemove(person)
                    }
                    className="remove-button"
                  >
                    ×
                  </button>

                </div>

              ))}

            </div>

          )}

        </section>


        {/* =========================
            EXPENSES
        ========================= */}

        <section className="reconciliator-section">

          <p className="reconciliator-section-label">
            03 — EXPENSES
          </p>


          {people.length === 0 ? (

            <p className="reconciliator-muted">
              Add some people before adding expenses.
            </p>

          ) : (

            <form
              className="expense-form"
              onSubmit={addExpense}
            >


              <input
                className="reconciliator-input"
                type="text"
                placeholder="What was it?"
                value={description}
                onChange={
                  e =>
                    setDescription(
                      e.target.value
                    )
                }
              />


              <input
                className="reconciliator-input"
                type="number"
                step="0.01"
                min="0"
                placeholder="Amount"
                value={amount}
                onChange={
                  e =>
                    setAmount(
                      e.target.value
                    )
                }
              />


              <select
                className="reconciliator-input"
                value={paidBy}
                onChange={
                  e =>
                    setPaidBy(
                      e.target.value
                    )
                }
              >

                <option value="">
                  Paid by...
                </option>


                {people.map(person => (

                  <option
                    key={person.id}
                    value={person.id}
                  >
                    {person.name}
                  </option>

                ))}

              </select>


              <button
                className="reconciliator-button"
                type="submit"
              >
                Add expense
              </button>

            </form>

          )}


          {/* =========================
              SPLIT BETWEEN
          ========================= */}

          {people.length > 0 && (

            <div className="split-section">

              <div className="split-header">

                <span>
                  Split between
                </span>


                <div>

                  <button
                    type="button"
                    onClick={
                      selectEveryone
                    }
                  >
                    Everyone
                  </button>


                  <button
                    type="button"
                    onClick={
                      clearEveryone
                    }
                  >
                    Clear
                  </button>

                </div>

              </div>


              <div className="split-people">

                {people.map(person => (

                  <label
                    className="split-person"
                    key={person.id}
                  >

                    <input
                      type="checkbox"
                      checked={
                        splitBetween.includes(
                          person.id
                        )
                      }
                      onChange={() =>
                        togglePerson(
                          person.id
                        )
                      }
                    />

                    <span>
                      {person.name}
                    </span>

                  </label>

                ))}

              </div>

            </div>

          )}


          {/* =========================
              EXPENSE LIST
          ========================= */}

          {expenses.length > 0 && (

            <div className="expense-list">

              {expenses.map(expense => {

                const paidByPerson =
                  people.find(
                    person =>
                      person.id ===
                      expense.paidBy
                  )


                const splitNames =
                  expense.splitBetween
                    .map(personId => {

                      const person =
                        people.find(
                          p =>
                            p.id ===
                            personId
                        )

                      return person
                        ? person.name
                        : ''
                    })
                    .filter(Boolean)


                return (

                  <div
                    className="expense"
                    key={expense.id}
                  >

                    <div>

                      <strong>
                        {expense.description}
                      </strong>

                      <span>
                        Paid by{' '}
                        {paidByPerson
                          ? paidByPerson.name
                          : ''}
                      </span>

                      <span>
                        Shared by{' '}
                        {splitNames.join(
                          ', '
                        )}
                      </span>

                    </div>


                    <div className="expense-right">

                      <strong>
                        $
                        {expense.amount.toFixed(
                          2
                        )}
                      </strong>


                      <button
                        onClick={() =>
                          removeExpense(
                            expense.id
                          )
                        }
                        className="remove-button"
                      >
                        ×
                      </button>

                    </div>

                  </div>

                )
              })}

            </div>

          )}

        </section>


        {/* =========================
            SUMMARY
        ========================= */}

        {people.length > 0 &&
          expenses.length > 0 && (

            <section className="reconciliator-section">

              <p className="reconciliator-section-label">
                04 — SUMMARY
              </p>


              <div className="summary">

                <div className="summary-stat">

                  <span>
                    Total spent
                  </span>

                  <strong>
                    ${total.toFixed(2)}
                  </strong>

                </div>

              </div>


              <div className="balances">

                {balances.map(person => (

                  <div
                    className="balance"
                    key={person.personId}
                  >

                    <div>

                      <strong>
                        {person.person}
                      </strong>

                      <span>
                        Paid $
                        {person.paid.toFixed(
                          2
                        )}
                      </span>

                      <span>
                        Share $
                        {person.share.toFixed(
                          2
                        )}
                      </span>

                    </div>


                    <strong
                      className={
                        person.balance >= 0
                          ? 'balance-positive'
                          : 'balance-negative'
                      }
                    >

                      {person.balance >= 0
                        ? '+'
                        : '-'}

                      $

                      {Math.abs(
                        person.balance
                      ).toFixed(2)}

                    </strong>

                  </div>

                ))}

              </div>

            </section>

          )}


        {/* =========================
            SETTLEMENT
        ========================= */}

        {settlements.length > 0 && (

          <section className="reconciliator-section settlement-section">

            <p className="reconciliator-section-label">
              05 — SETTLEMENT
            </p>


            <h2>
              Who pays who?
            </h2>


            <div className="settlements">

              {settlements.map(
                (settlement, index) => (

                  <div
                    className="settlement"
                    key={index}
                  >

                    <strong>
                      {settlement.from}
                    </strong>

                    <span>
                      →
                    </span>

                    <strong>
                      {settlement.to}
                    </strong>

                    <strong>
                      $
                      {settlement.amount.toFixed(
                        2
                      )}
                    </strong>

                  </div>

                )
              )}

            </div>

          </section>

        )}

      </div>
    
    {personToRemove && (

      <div className="confirmation-overlay">

        <div className="confirmation-modal">

          <p className="reconciliator-section-label">
            REMOVE PERSON
          </p>

          <h2>
            Remove {personToRemove.name}?
          </h2>

          <p>
            This will remove {personToRemove.name} from
            the trip. Any expenses associated with this
            person may also be affected.
          </p>

          <div className="confirmation-actions">

            <button
              type="button"
              className="confirmation-cancel"
              onClick={() =>
                setPersonToRemove(null)
              }
            >
              Cancel
            </button>

            <button
              type="button"
              className="confirmation-delete"
              onClick={async () => {

                const personId = personToRemove.id

                // Close popup immediately
                setPersonToRemove(null)

                // Then delete
                await removePerson(personId)

              }}
            >
              Remove person
            </button>
          </div>
        </div>
      </div>
    )}

    </div>
  )
}

export default ReconciliatorTrip