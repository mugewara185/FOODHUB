import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, IconButton, Badge } from '@mui/material';
import { OpenInFull, Close, DirectionsBike, Message } from '@mui/icons-material';
import { DraggableContainer } from '../../../../core/ui/draggable/DraggableContainer';
import Map from '../../../../shared/components/maps/Map';
import { formatDuration } from '../../../../core/utils/location';
import { useGlobalDeliveryTracker, FALLBACK_RESTAURANT, FALLBACK_CUSTOMER } from '../../hooks/useGlobalDeliveryTracker';
import { useAuth } from '../../../../contexts/AuthContext';
import { useAppSelector } from '../../../../app/store/hooks';
import { selectCurrentOrder } from '../../orderSlice';
import { logComponent, logger } from '../../../../core/dev/logger';

const GlobalDeliveryPip: React.FC = () => {
    useEffect(() => {
        // logComponent.mount('GlobalDeliveryPip');
        return () => {
            // logComponent.unmount('GlobalDeliveryPip');
        };
    }, []);

    logComponent.render('GlobalDeliveryPip');

    const liveTracking = useGlobalDeliveryTracker();
    const locationPath = useLocation().pathname;
    const navigate = useNavigate();
    const { user } = useAuth();
    const currentOrder = useAppSelector(selectCurrentOrder);

    const [isMinimized, setIsMinimized] = useState(false);

    if (!user || !user.role || !user.role.includes('user')) {
        // logger.debug('COMPONENT', 'GlobalDeliveryPip hidden: Not a user role', { event: 'FLOW', data: { userRole: user?.role } });
        return null;
    }
    if (!liveTracking) {
        // logger.debug('COMPONENT', 'GlobalDeliveryPip hidden: No live tracking active', { event: 'FLOW' });
        return null;
    }

    const { orderId, status, location, etaSeconds, partner, unreadCount } = liveTracking;

    // Don't show PIP on the tracking page itself to avoid map collisions
    if (locationPath === `/orders/tracking/` + orderId) {
        // logger.debug('COMPONENT', 'GlobalDeliveryPip hidden: On tracking page', { event: 'FLOW', data: { locationPath, orderId } });
        return null;
    }

    if (status === 'delivered') {
        // logger.debug('COMPONENT', 'GlobalDeliveryPip hidden: Order delivered', { event: 'FLOW', data: { status } });
        return null;
    }

    const resLoc = FALLBACK_RESTAURANT;
    const cusLoc = currentOrder?.deliveryInfo?.coordinates || FALLBACK_CUSTOMER;
    const mapCenter = location || resLoc;
    const routeCoordinates = location ? [location, cusLoc] : [resLoc, cusLoc];
    const markers = [
        { id: 'restaurant', type: 'restaurant', position: resLoc, title: 'Restaurant' },
        { id: 'customer', type: 'customer', position: cusLoc, title: 'You' },
    ];
    if (location) {
        markers.push({ id: 'partner', type: 'partner', position: location, title: partner?.name || 'Partner' });
    }

    // logger.debug('COMPONENT', 'GlobalDeliveryPip rendering visible PIP', { event: 'FLOW', data: { isMinimized, status, locationPath } });

    return (
        <DraggableContainer width={isMinimized ? 200 : 300} height={isMinimized ? 60 : 320} storageKey="global-pip">
            <Paper sx={{ width: isMinimized ? 200 : 300, overflow: 'hidden', borderRadius: 3, boxShadow: 6, pointerEvents: 'auto' }}>
                <Box sx={{ p: 1.5, bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DirectionsBike fontSize="small" />
                        <Typography variant="subtitle2" fontWeight={600}>Live Delivery</Typography>
                    </Box>
                    <Box>
                        <IconButton size="small" sx={{ color: 'white' }} onClick={() => {
                            // logger.debug('COMPONENT', 'GlobalDeliveryPip toggle minimize', { event: 'USER_ACTION', data: { nextState: !isMinimized } });
                            setIsMinimized(!isMinimized);
                        }}>
                            {isMinimized ? <OpenInFull fontSize="small" /> : <Close fontSize="small" />}
                        </IconButton>
                    </Box>
                </Box>

                {!isMinimized && (
                    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 270 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" fontWeight={600}>Arriving in</Typography>
                            <Typography variant="body2" color="primary.main" fontWeight={800}>
                                {etaSeconds > 0 ? formatDuration(etaSeconds) : (location ? 'Calculating...' : 'Waiting for partner')}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1, borderRadius: 2, overflow: 'hidden', mb: 2, pointerEvents: 'none' }}>
                            <Map center={mapCenter} zoom={14} height="100%" markers={markers} routeCoordinates={routeCoordinates} />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" fontWeight={600}>{status.replace(/_/g, ' ').toUpperCase()}</Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {unreadCount > 0 && (
                                    <Badge badgeContent={unreadCount} color="error">
                                        <Message color="action" fontSize="small" />
                                    </Badge>
                                )}
                                <Typography
                                    variant="caption"
                                    color="primary"
                                    sx={{ cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                                    onClick={() => navigate(`/orders/tracking/` + orderId)}
                                >
                                    Open Tracking
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                )}
            </Paper>
        </DraggableContainer>
    );
};

export default GlobalDeliveryPip;
