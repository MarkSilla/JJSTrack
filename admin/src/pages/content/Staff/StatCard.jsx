import React from 'react';
import { StatCard as SharedStatCard } from '../../../components/ui';

const StatCard = ({ label, value, sub, icon: Icon, color, onClick }) => (
    <SharedStatCard
        label={label}
        value={value}
        sub={sub}
        icon={Icon}
        accentColor={color}
        onClick={onClick}
    />
);

export default StatCard;
