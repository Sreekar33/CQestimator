import React, { FC } from "react";
import { css } from "@emotion/css";

interface GaugeProps {
  label: string;
  value: number; // 0 - 1
  color: string;
  icon?: string;
}

export const Gauge: FC<GaugeProps> = ({
  label,
  value,
  color,
  icon,
}) => {
  const percentage = Math.round(value * 100);

  const radius = 28;
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset =
    circumference - value * circumference;

  return (
    <div className={styles.container}>
      <svg
        className={styles.svg}
        viewBox="0 0 64 64"
      >
        {/* Background circle */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="#333"
          strokeWidth="4"
        />

        {/* Progress circle */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 32 32)"
          style={{
            transition:
              "stroke-dashoffset 0.15s ease-out",
          }}
        />
      </svg>

      <div className={styles.valueContainer}>
        {icon && (
          <span className={styles.icon}>
            {icon}
          </span>
        )}

        <span className={styles.value}>
          {percentage}%
        </span>
      </div>

      <span className={styles.label}>
        {label}
      </span>
    </div>
  );
};

const styles = {
  container: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    position: relative;
  `,

  svg: css`
    width: 64px;
    height: 64px;
  `,

  valueContainer: css`
    position: absolute;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    width: 64px;
    height: 32px;
  `,

  icon: css`
    font-size: 14px;
    line-height: 1;
  `,

  value: css`
    font-size: 11px;
    color: #fff;
    font-weight: 600;
  `,

  label: css`
    font-size: 10px;
    color: #aaa;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,
};