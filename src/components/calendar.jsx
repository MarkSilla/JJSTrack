import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import '../styles/calendar.css'

/* ── Calendar Utilities & Data ────────────────────────────────── */
const pad = (n) => String(n).padStart(2, '0')
export const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const MAX_SLOTS = 10

export const buildSlotMap = () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    const map = {}
    const set = (day, used) => { map[`${y}-${pad(m + 1)}-${pad(day)}`] = used }
    set(5, 10); set(10, 10); set(12, 8); set(15, 6)
    set(18, 10); set(20, 4); set(22, 9); set(25, 7); set(28, 3)
    // Next month
    const nm = m + 1
    const nk = (day, used) => { map[`${nm > 11 ? y + 1 : y}-${pad((nm % 12) + 1)}-${pad(day)}`] = used }
    nk(3, 10); nk(8, 5); nk(14, 9); nk(20, 7)
    return map
}

export const SLOT_MAP = buildSlotMap()

export const USER_BOOKINGS = [
    { date: '2026-02-22', service: 'Custom Repair', orderId: 'ORD-2026-001', status: 'Approved' },
    { date: '2026-03-08', service: 'Team Jersey', orderId: 'ORD-2026-003', status: 'Pending' },
]
/* ───────────────────────────────────────────────────────────── */

const CalendarComponent = ({ events = [], dateClick, dayCellClassNames, dayCellContent }) => {
    return (
        <div className="calendar-wrapper">
            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                selectable={true}
                headerToolbar={{
                    left: 'title',
                    center: '',
                    right: 'prev,next',
                }}
                dayHeaderFormat={{ weekday: 'short' }}
                fixedWeekCount={false}
                height="auto"
                events={events}
                dateClick={dateClick}
                dayCellClassNames={dayCellClassNames}
                dayCellContent={dayCellContent}
            />
        </div>
    )
}

export default CalendarComponent