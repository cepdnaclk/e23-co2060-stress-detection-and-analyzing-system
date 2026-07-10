import React from "react";
import { View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

/**
 * SVG Donut Chart component.
 * @param {Array} data  - [{ label, value, color }]
 * @param {number} size - overall diameter in pixels
 * @param {number} strokeWidth - ring thickness
 * @param {string} trackColor   - background ring colour
 * @param {ReactNode} centerContent - content to display in the hole
 */
export default function DonutChart({ data = [], size = 170, strokeWidth = 28, trackColor = "#e8eff6", centerContent }) {
  const radius      = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total       = data.reduce((s, d) => s + (d.value || 0), 0);

  let accum = 0;
  const slices = data.map((item) => {
    const fraction  = total > 0 ? (item.value || 0) / total : 0;
    const dashLen   = fraction * circumference;
    const rotation  = (accum / circumference) * 360;
    accum += dashLen;
    return { ...item, dashLen, gapLen: circumference - dashLen, rotation };
  });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation={-90} origin={`${size / 2},${size / 2}`}>
          {/* Track ring */}
          <Circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={trackColor} strokeWidth={strokeWidth} fill="none"
          />
          {/* Data slices */}
          {slices.map((s, i) =>
            s.dashLen > 0 ? (
              <Circle
                key={i}
                cx={size / 2} cy={size / 2} r={radius}
                stroke={s.color} strokeWidth={strokeWidth} fill="none"
                strokeDasharray={`${s.dashLen} ${s.gapLen}`}
                strokeDashoffset={0}
                rotation={s.rotation}
                origin={`${size / 2},${size / 2}`}
                strokeLinecap="butt"
              />
            ) : null
          )}
        </G>
      </Svg>
      {centerContent ? (
        <View style={{ position: "absolute", alignItems: "center", justifyContent: "center" }}>
          {centerContent}
        </View>
      ) : null}
    </View>
  );
}
