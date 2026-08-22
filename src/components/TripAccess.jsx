import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './tripaccess.css'

function TripAccess({ trip, onClose }) {

  const [emails, setEmails] = useState([])
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [creatorEmail, setCreatorEmail] = useState('')

  /* =========================
     LOAD ACCESS
  ========================= */

  useEffect(() => {

    if (!trip) return

    async function loadAccess() {

      setLoading(true)

      /* =========================
         LOAD CREATOR EMAIL
      ========================= */

      const {
        data: tripData,
        error: tripError
      } = await supabase
        .from('trips')
        .select('creator_email')
        .eq('id', trip.id)
        .single()

      if (tripError) {

        console.error(
          'Error loading creator email:',
          tripError
        )

        setLoading(false)
        return
      }

      const creator =
        tripData.creator_email
          ?.trim()
          .toLowerCase() || ''

      setCreatorEmail(creator)


      /* =========================
         LOAD ADDITIONAL ACCESS
      ========================= */

      const {
        data,
        error
      } = await supabase
        .from('trip_access')
        .select('id, email')
        .eq('trip_id', trip.id)
        .order('created_at', {
          ascending: true
        })

      if (error) {

        console.error(
          'Error loading trip access:',
          error
        )

        setEmails([])

      } else {

        setEmails(data || [])
      }

      setLoading(false)
    }

    loadAccess()

  }, [trip])


  /* =========================
     ADD EMAIL
  ========================= */

  async function addEmail(e) {

    e.preventDefault()

    const email =
      newEmail.trim().toLowerCase()

    if (!email) return

    if (!email.includes('@')) {

      alert(
        'Please enter a valid email address.'
      )

      return
    }


    /* =========================
       CHECK CREATOR
    ========================= */

    if (email === creatorEmail) {

      alert(
        'This email is already the creator of the trip.'
      )

      return
    }


    /* =========================
       CHECK DUPLICATE
    ========================= */

    const alreadyExists =
      emails.some(
        item =>
          item.email.trim().toLowerCase() === email
      )

    if (alreadyExists) {

      alert(
        'This email already has access.'
      )

      return
    }


    /* =========================
       INSERT
    ========================= */

    const {
      data,
      error
    } = await supabase
      .from('trip_access')
      .insert({
        trip_id: trip.id,
        email
      })
      .select('id, email')
      .single()

    if (error) {

      console.error(
        'Error adding email:',
        error
      )

      alert(error.message)

      return
    }


    setEmails(prev => [
      ...prev,
      data
    ])

    setNewEmail('')
  }


  /* =========================
     DELETE EMAIL
  ========================= */

  async function deleteEmail(id) {

    const { error } = await supabase
      .from('trip_access')
      .delete()
      .eq('id', id)

    if (error) {

      console.error(
        'Error deleting email:',
        error
      )

      alert(error.message)

      return
    }

    setEmails(prev =>
      prev.filter(
        item => item.id !== id
      )
    )
  }


  /* =========================
     NO TRIP
  ========================= */

  if (!trip) {
    return null
  }


  /* =========================
     DISPLAY EMAILS
  ========================= */

  const displayEmails = [
    ...(creatorEmail
      ? [
          {
            id: 'creator',
            email: creatorEmail,
            isCreator: true
          }
        ]
      : []
    ),

    ...emails.map(item => ({
      ...item,
      isCreator: false
    }))
  ]


  /* =========================
     RENDER
  ========================= */

  return (

    <div
      className="trip-access-overlay"
      onClick={onClose}
    >

      <div
        className="trip-access-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        <p className="trip-access-label">
          TRIP ACCESS
        </p>

        <h2>
          {trip.name}
        </h2>

        <p className="trip-access-description">
          Add email addresses that are allowed
          to access this trip.
        </p>


        {/* =========================
            ADD EMAIL
        ========================= */}

        <form
          className="trip-access-form"
          onSubmit={addEmail}
        >

          <input
            type="email"
            placeholder="Email address"
            value={newEmail}
            onChange={(e) =>
              setNewEmail(e.target.value)
            }
          />

          <button
            type="submit"
          >
            Add
          </button>

        </form>


        {/* =========================
            EMAIL LIST
        ========================= */}

        <div className="trip-access-list">

          {loading ? (

            <p className="trip-access-muted">
              Loading...
            </p>

          ) : displayEmails.length === 0 ? (

            <p className="trip-access-muted">
              No emails have access yet.
            </p>

          ) : (

            displayEmails.map(item => (

              <div
                className="trip-access-item"
                key={item.id}
              >

                <span>
                  {item.email}
                </span>


                {item.isCreator ? (

                  <span className="trip-access-owner">
                    Creator
                  </span>

                ) : (

                  <button
                    type="button"
                    onClick={() =>
                      deleteEmail(item.id)
                    }
                  >
                    ×
                  </button>

                )}

              </div>

            ))

          )}

        </div>


        {/* =========================
            FOOTER
        ========================= */}

        <div className="trip-access-footer">

          <button
            type="button"
            onClick={onClose}
          >
            Done
          </button>

        </div>

      </div>

    </div>
  )
}

export default TripAccess