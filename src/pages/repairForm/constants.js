import { MdContentCut } from 'react-icons/md'
import { FaTshirt } from 'react-icons/fa'

export const STEP_LABELS = ['Service', 'Options', 'Photo', 'Details', 'Pickup', 'Review']

export const REPAIR_OPTIONS = [
    { id: 'zipper', label: 'Zipper Replacement', price: 150 },
    { id: 'button', label: 'Button Replacement', price: 50 },
    { id: 'hem', label: 'Hem Adjustment', price: 120 },
    { id: 'waist', label: 'Waist Adjustment', price: 200 },
    { id: 'patch', label: 'Patch / Mending', price: 180 },
    { id: 'lining', label: 'Lining Repair', price: 250 },
    { id: 'sleeve', label: 'Sleeve Adjustment', price: 180 },
    { id: 'general', label: 'General Repair', price: 100 },
    { id: 'others', label: 'Others', price: '' },
]

export const TIME_SLOTS = [
    { id: 'morning', label: 'Morning', range: '08:00 AM – 12:00 PM' },
    { id: 'afternoon', label: 'Afternoon', range: '01:00 PM – 05:00 PM' },
    { id: 'evening', label: 'Evening', range: '05:00 PM – 08:00 PM' },
]

export const SERVICES = [
    { id: 'repair', label: 'Custom Repair', desc: 'Alterations, repairs & fixes for your garments', Icon: MdContentCut },
    { id: 'jersey', label: 'Team Jersey', desc: 'Custom jerseys for your team or organization', Icon: FaTshirt },
]

export const getWeekDays = () => {
    const days = []
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const d = new Date()
    while (days.length < 6) {
        if (d.getDay() !== 0) days.push({ day: names[d.getDay()], date: d.getDate(), full: new Date(d) })
        d.setDate(d.getDate() + 1)
    }
    return days
}
