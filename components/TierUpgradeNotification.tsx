import React, { useEffect, useState } from 'react';
import { Tier } from '../lib/tierSystem';
import './TierUpgradeNotification.css';

interface Props {
  tier: Tier;
  onDismiss: () => void;
}

export function TierUpgradeNotification({ tier, onDismiss }: Props) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Haptic feedback simulation (vibration on mobile)
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    // Auto-dismiss after 4.5 seconds
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onDismiss, 400); // Wait for exit animation
    }, 4500);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  // Get newly unlocked rewards (last 1-2 rewards in the tier)
  const newRewards = tier.rewardDetails.slice(-2);

  return (
    <div className={`ios-notification ${isExiting ? 'exiting' : ''}`}>
      {/* Notification Header (iOS-style) */}
      <div className="notification-header">
        <div className="app-icon">
          <div className="peakflow-icon">🌊</div>
        </div>
        <div className="notification-meta">
          <span className="app-name">PeakFlow</span>
          <span className="timestamp">now</span>
        </div>
      </div>

      {/* Notification Content */}
      <div className="notification-content">
        <div className="tier-badge-showcase" style={{ fontSize: '48px' }}>
          {tier.badge}
        </div>
        <h3 className="notification-title">Tier Upgrade! 🎉</h3>
        <p className="notification-message">
          You've reached <strong style={{ color: tier.color }}>
            {tier.name}
          </strong>
        </p>
        <div className="tier-milestone">
          <div
            className="tier-color-bar"
            style={{ background: tier.gradient }}
          />
          <span className="milestone-points">{tier.threshold} Impact Points</span>
        </div>

        {/* Show newly unlocked rewards */}
        {newRewards.length > 0 && (
          <div className="new-rewards">
            <p className="rewards-label">New Rewards Unlocked:</p>
            <div className="reward-icons">
              {newRewards.map((reward, i) => (
                <span
                  key={i}
                  className="reward-icon"
                  title={reward.name}
                  aria-label={reward.name}
                >
                  {reward.icon}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        className="notification-action"
        onClick={onDismiss}
        aria-label="View rewards"
      >
        View Rewards →
      </button>
    </div>
  );
}
