import  React, { FC } from 'react';
import { css } from '@emotion/css';


interface EngagementTiemlineProps {
    history: number[];
    maxPoints: number;
}

export const EngagementTimeline: FC<EngagementTiemlineProps> = ({ history, maxPoints }) => {
    const barWidth = 100 / maxPoints;

    return (
        <div className={styles.container}>
            <span className={styles.label}> Engagement Timeline</span>
            <div className={styles.timeline}>
                {history.map((value, i) => (
                    <div
                        key={i} 
                        className={styles.bar }
                        style={{
                            width: `${barWidth}%`,
                            backgroundColor: getColor(value),
                            opacity: 0.4 +value * 0.6,
                        }}
                    />
                ))}
            </div>
        </div>
    );
}


function getColor(value: number): string {
  if (value > 0.6) {
    return '#4ade80';
  }
  if (value > 0.3) {
    return '#facc15';
  }
  return '#f87171';
}

const styles = {
  container: css`
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
  `,

  label: css`
    font-size: 10px;
    color: #aaa;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,

  timeline: css`
    display: flex;
    height: 12px;
    width: 100%;
    border-radius: 4px;
    overflow: hidden;
    background-color: #222;
  `,

  bar: css`
    height: 100%;
    transition: background-color 0.2s ease;
  `,
};