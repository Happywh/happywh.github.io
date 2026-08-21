import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import './Reconciliator.css'

function Reconciliator() {
  const navigate = useNavigate()

  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)

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

    console.log('Creating trip:', tripName.trim())

    const { data, error } = await supabase
        .from('trips')
        .insert({
        name: tripName.trim()
        })
        .select()
        .single()

    console.log('Supabase response:', { data, error })

    if (error) {
        console.error('Error creating trip:', error)
        alert(`Error creating trip: ${error.message}`)
        return
    }

    console.log('Trip created:', data)

    navigate(`/reconciliator/${data.id}`)
    }

  function openTrip(trip) {
    navigate(`/reconciliator/${trip.id}`)
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

                <button
                  key={trip.id}
                  className="trip-card"
                  onClick={() => openTrip(trip)}
                >

                  <span>
                    {trip.name}
                  </span>

                  <span>
                    →
                  </span>

                </button>

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

    </div>
  )
}

export default Reconciliator