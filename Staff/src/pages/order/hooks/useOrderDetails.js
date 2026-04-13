import { useMemo, useState, useEffect } from 'react';
import { bookingApi } from '../../../services/bookingApi';

const SERVICE_STEPS = {
    "Team Jersey": ["Dropped Off", "Layout", "Printing", "Sewing", "Pick-up"],
    "Organization": ["Dropped Off", "Layout", "Printing", "Sewing", "Pick-up"],
    "Repair": ["Drop Off", "Cutting", "Sewing", "Pick-up"],
};

const useOrderDetails = (orderId) => {
    const [order, setOrder] = useState(null);
    
    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!orderId) {
                setOrder(null);
                return;
            }
            
            try {
                const response = await bookingApi.getBookingById(orderId);
                const booking = response.booking || response.data || response;
                
                if (booking) {
                    // Map booking to order format that OrderDetails expects
                    const mappedOrder = {
                        // Basic info
                        id: booking._id || booking.id,
                        _id: booking._id,
                        
                        // Team/Org info
                        teamName: booking.teamName || booking.orgName || booking.service || 'Order',
                        team: booking.teamName || booking.orgName,
                        category: booking.bookingType || 'Service',
                        
                        // Customer/Contact info
                        customer: booking.contact?.fullName || 'Unknown',
                        customerName: booking.contact?.fullName || 'Unknown',
                        contact: booking.contact || { fullName: 'Unknown', phone: 'N/A' },
                        
                        // Service info - Display bookingType as the type
                        service: booking.service || booking.bookingType || 'Service',
                        serviceType: booking.bookingType,
                        serviceTitle: booking.service || booking.bookingType, // Fallback to bookingType if service is empty
                        bookingType: booking.bookingType,
                        type: booking.bookingType, // Add type field as well
                        
                        // Players/Roster
                        teamRoster: booking.players || booking.members || [],
                        players: booking.players || booking.members || [],
                        
                        // Items
                        items: booking.items || [],
                        
                        // Steps/Progress
                        steps: booking.steps || [],
                        productionProgress: booking.steps || [],
                        
                        // Dates
                        pickupDate: booking.pickupDate,
                        pickupSlot: booking.pickupSlot,
                        dropDate: booking.createdAt,
                        dueDate: booking.pickupDate || booking.createdAt, // Use pickup date as due date, fallback to created date
                        createdAt: booking.createdAt,
                        
                        // Status
                        status: booking.status || 'Pending',
                        
                        // Repair/Design files
                        photos: booking.photos || [],
                        designImages: booking.photos || [],
                        designFile: booking.designFile || booking.orgDesignFile,
                        driveLink: booking.driveLink || booking.orgDriveLink,
                        
                        // Other
                        assignedBy: booking.assignedTailor || 'Admin',
                        assignedTailor: booking.assignedTailor,
                        notes: booking.notes,
                        adminNotes: booking.adminNotes,
                        repairDescription: booking.repairDescription,
                        
                        // Keep everything from booking
                        ...booking
                    };
                    console.log('✅ Mapped order:', {
                        service: mappedOrder.service,
                        serviceType: mappedOrder.serviceType,
                        serviceTitle: mappedOrder.serviceTitle,
                        bookingType: mappedOrder.bookingType,
                        dueDate: mappedOrder.dueDate,
                        pickupDate: mappedOrder.pickupDate,
                        createdAt: mappedOrder.createdAt,
                        dropDate: mappedOrder.dropDate
                    });
                    console.log('✅ Mapped order:', {
                        service: mappedOrder.service,
                        serviceType: mappedOrder.serviceType,
                        serviceTitle: mappedOrder.serviceTitle,
                        bookingType: mappedOrder.bookingType,
                        dueDate: mappedOrder.dueDate,
                        pickupDate: mappedOrder.pickupDate,
                        createdAt: mappedOrder.createdAt,
                        dropDate: mappedOrder.dropDate
                    });
                    setOrder(mappedOrder);
                } else {
                    console.log('❌ No booking data found');
                    setOrder(null);
                }
            } catch (err) {
                console.error('Error fetching order details:', err);
                setOrder(null);
            }
        };
        
        fetchOrderDetails();
    }, [orderId]);

    const steps = useMemo(() => {
        if (!order) return [];
        return order.steps || order.productionProgress || SERVICE_STEPS[order.serviceType] || SERVICE_STEPS["Team Jersey"];
    }, [order]);

    const currentStepIdx = useMemo(() => {
        if (!order || !steps) return 0;
        const activeIdx = steps.findIndex(s => s.active);
        if (activeIdx !== -1) return activeIdx;
        const notDoneIdx = steps.findIndex(s => !s.done);
        return notDoneIdx !== -1 ? notDoneIdx : steps.length - 1;
    }, [order, steps]);

    const statusLabel = useMemo(() => {
        if (!order) return 'Pending';
        if (order.status === 'In Progress' || order.status === 'In-Progress') return 'In Progress';
        if (order.status === 'Completed' || order.status === 'Complete') return 'Completed';
        return 'Pending';
    }, [order]);

    return { order, steps, currentStepIdx, statusLabel };
};

export default useOrderDetails;
