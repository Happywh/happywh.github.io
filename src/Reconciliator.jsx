import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import './Reconciliator.css'
import TripAccess from './components/TripAccess'

function Reconciliator() {
  const navigate = useNavigate()

  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [accessTrip, setAccessTrip] = useState(null)

  async function loadTrips() {
    setLoading(true)

    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading trips:', error)
      setLoading(false)
      return
    }

    setTrips(data)
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
      ADD CREATOR TO ACCESS
    ========================= */

    const {
      error: accessError
    } = await supabase
      .from('trip_access')
      .insert({
        trip_id: data.id,
        email: creatorEmail
      })

    if (accessError) {

      console.error(
        'Error adding creator to trip access:',
        accessError
      )

      alert(
        `Trip created, but access setup failed: ${accessError.message}`
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

    </div>
  )
}

export default Reconciliator