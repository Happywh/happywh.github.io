import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './tripaccess.css'

function TripAccess({ trip, onClose }) {

  const [emails, setEmails] = useState([])
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [creatorEmail, setCreatorEmail] = useState('')

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

        } else {

        setCreatorEmail(
            tripData.creator_email
            ?.trim()
            .toLowerCase() || ''
        )
        }


        /* =========================
        LOAD ACCESS EMAILS
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

        } else {

        setEmails(data || [])
        }

        setLoading(false)
    }

    loadAccess()

    }, [trip])

  async function addEmail(e) {

    e.preventDefault()

    const email =
      newEmail.trim().toLowerCase()

    if (!email) return

    if (!email.includes('@')) {
      alert('Please enter a valid email address.')
      return
    }

    const { data, error } = await supabase
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


  if (!trip) {
    return null
  }


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


        <div className="trip-access-list">

          {loading ? (

            <p className="trip-access-muted">
              Loading...
            </p>

          ) : emails.length === 0 ? (

            <p className="trip-access-muted">
              No emails have access yet.
            </p>

          ) : (

            emails.map(item => (

              <div
                className="trip-access-item"
                key={item.id}
                >
                <span>
                    {item.email}
                </span>

                {item.email.trim().toLowerCase() === creatorEmail ? (
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