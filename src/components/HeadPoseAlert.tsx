import React, { FC } from "react";
import { css } from "@emotion/css";

interface HeadPoseAlertProps {
  lookingDown: boolean;
  lookingAway: boolean;
}

export const HeadPoseAlert: FC<HeadPoseAlertProps> = ({
  lookingDown,
  lookingAway,
}) => {
  if (!lookingDown && !lookingAway) {
    return null;
  }

  const message = lookingDown
    ? "Look up - maintain eye level!"
    : "Look at the camera";

  return (
    <div className={styles.alert}>
      {message}
    </div>
  );
};

const styles = {
  alert: css`
    background-color: rgba(251, 191, 36, 0.15);
    border: 1px solid rgba(251, 191, 36, 0.4);
    color: #fbbf24;

    padding: 6px 12px;
    border-radius: 6px;

    font-size: 12px;
    text-align: center;

    animation: pulse 1.5s ease-in-out infinite;

    @keyframes pulse {
      0%,
      100% {
        opacity: 1;
      }

      50% {
        opacity: 0.7;
      }
    }
  `,
};