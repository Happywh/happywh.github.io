import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import './Reconciliator.css'
import TripAccess from './components/TripAccess'

function Reconciliator() {
  const navigate = useNavigate()

  const [tripToDelete, setTripToDelete] = useState(null)
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [accessTrip, setAccessTrip] = useState(null)

  async function loadTrips() {
    setLoading(true)
    // Get logged-in user
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user || !user.email) {
      console.error(
        'Error getting logged-in user:',
        userError
      )

      setLoading(false)
      return
    }

    const userEmail =
      user.email.trim().toLowerCase()

    // Load trips
    const {
      data,
      error
    } = await supabase
      .from('trips')
      .select('id, name, created_at, creator_email')
      .order('created_at', {
        ascending: false
      })

    if (error) {
      console.error(
        'Error loading trips:',
        error
      )

    setLoading(false)
    return
  }

  // Mark whether current user is creator
  const tripsWithCreatorStatus =
    (data || []).map(trip => ({
      ...trip,
      isCreator:
        trip.creator_email
          ?.trim()
          .toLowerCase() === userEmail
    }))

  setTrips(tripsWithCreatorStatus)
  setLoading(false)
}

  useEffect(() => {
    loadTrips()
  }, [])

  async function addTrip() {

    const tripName = window.prompt('Enter trip name')
    if (!tripName || !tripName.trim()) {
      return
    }
    /* =========================
      CHECK USER
    ========================= */
    const {
      data: {
        user
      },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {

      alert(
        'You must be logged in to create a trip.'
      )

      return
    }
    if (!user.email) {
      alert(
        'Your account does not have an email address.'
      )
      return
    }
    const creatorEmail =
      user.email.trim().toLowerCase()
    /* =========================
      CREATE TRIP
    ========================= */
    const {
      data,
      error
    } = await supabase
      .from('trips')
      .insert({
        name: tripName.trim(),
        creator_email: creatorEmail
      })
      .select()
      .single()

    if (error) {

      console.error(
        'Error creating trip:',
        error
      )

      alert(
        `Error creating trip: ${error.message}`
      )
      return
    }

    /* =========================
      GO TO TRIP
    ========================= */

    navigate(
      `/tools/reconciliator/${data.id}`
    )
  }
  
  function openTrip(trip) {
    navigate(`/tools/reconciliator/${trip.id}`)
  }

  async function deleteTrip(tripId) {
    // Delete expense_people first
    const { data: expenses, error: expensesError } =
      await supabase
        .from('expenses')
        .select('id')
        .eq('trip_id', tripId)

    if (expensesError) {
      console.error(
        'Error loading expenses for deletion:',
        expensesError
      )

      alert(
        `Error deleting trip: ${expensesError.message}`
      )

      return
    }


    if (expenses && expenses.length > 0) {

      const expenseIds =
        expenses.map(expense => expense.id)

      const {
        error: expensePeopleError
      } = await supabase
        .from('expense_people')
        .delete()
        .in('expense_id', expenseIds)

      if (expensePeopleError) {

        console.error(
          'Error deleting expense people:',
          expensePeopleError
        )

        alert(
          `Error deleting trip: ${expensePeopleError.message}`
        )

        return
      }
    }


    // Delete expenses
    const {
      error: expensesDeleteError
    } = await supabase
      .from('expenses')
      .delete()
      .eq('trip_id', tripId)

    if (expensesDeleteError) {

      console.error(
        'Error deleting expenses:',
        expensesDeleteError
      )

      alert(
        `Error deleting trip: ${expensesDeleteError.message}`
      )

      return
    }


    // Delete trip people
    const {
      error: peopleError
    } = await supabase
      .from('trip_people')
      .delete()
      .eq('trip_id', tripId)

    if (peopleError) {

      console.error(
        'Error deleting trip people:',
        peopleError
      )

      alert(
        `Error deleting trip: ${peopleError.message}`
      )

      return
    }


    // Delete trip access
    const {
      error: accessError
    } = await supabase
      .from('trip_access')
      .delete()
      .eq('trip_id', tripId)

    if (accessError) {

      console.error(
        'Error deleting trip access:',
        accessError
      )

      alert(
        `Error deleting trip: ${accessError.message}`
      )

      return
    }


    // Finally delete trip
    const {
      error: tripError
    } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId)

    if (tripError) {

      console.error(
        'Error deleting trip:',
        tripError
      )

      alert(
        `Error deleting trip: ${tripError.message}`
      )

      return
    }


    // Remove from UI
    setTrips(prev =>
      prev.filter(
        trip => trip.id !== tripId
      )
    )

    setTripToDelete(null)
  }

  return (
    <div className="reconciliator-page">

      <div className="reconciliator-container">

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

        </header>


        <section className="reconciliator-section">

          <p className="reconciliator-section-label">
            YOUR TRIPS
          </p>

          {loading ? (

            <p className="reconciliator-muted">
              Loading trips...
            </p>

          ) : trips.length === 0 ? (

            <p className="reconciliator-muted">
              No trips yet.
            </p>

          ) : (

            <div className="trip-list">
            {trips.map(trip => (

              <div
                className="trip-card"
                key={trip.id}
                onClick={() => openTrip(trip)}
              >

                <span className="trip-card-name">
                  {trip.name}
                </span>


                {trip.isCreator && (

                  <div className="trip-card-actions">

                    <button
                      type="button"
                      className="trip-access-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setAccessTrip(trip)
                      }}
                    >
                      Manage access
                    </button>

                    <button
                      type="button"
                      className="trip-delete-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setTripToDelete(trip)
                      }}
                    >
                      Delete
                    </button>

                  </div>
                )}
              </div>
            ))}
          </div>
          )}

        </section>

        <button
          className="add-trip-button"
          onClick={addTrip}
        >
          + Add Trip
        </button>

      </div>
      <TripAccess
        trip={accessTrip}
        onClose={() => setAccessTrip(null)}
      />

    {tripToDelete && (

    <div
      className="confirmation-overlay"
      onClick={() => setTripToDelete(null)}
    >

      <div
        className="confirmation-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        <p className="reconciliator-section-label">
          DELETE TRIP
        </p>

        <h2>
          Delete {tripToDelete.name}?
        </h2>

        <p>
          This will permanently delete the trip,
          its participants, expenses, and access
          settings. This cannot be undone.
        </p>

        <div className="confirmation-actions">

          <button
            type="button"
            className="confirmation-cancel"
            onClick={() =>
              setTripToDelete(null)
            }
          >
            Cancel
          </button>

          <button
            type="button"
            className="confirmation-delete"
            onClick={async () => {

              const tripId =
                tripToDelete.id

              await deleteTrip(tripId)

            }}
          >
            Delete trip
          </button>

        </div>

      </div>

    </div>

  )}
  </div>
  )
}

export default Reconciliator