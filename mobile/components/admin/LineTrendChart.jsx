import React from "react";
import { View } from "react-native";
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from "react-native-svg";

/**
 * SVG Line chart with gradient area fill.
 * @param {number[]} values  - array of numeric data points
 * @param {number}   width   - chart width in pixels
 * @param {number}   height  - chart height in pixels
 * @param {string}   lineColor  - stroke colour
 * @param {string}   fillStart  - gradient top color (rgba)
 * @param {string}   fillEnd    - gradient bottom color (rgba)
 * @param {boolean}  showDots   - whether to render data point dots
 */
export default function LineTrendChart({
  values = [],
  width = 300,
  height = 160,
  lineColor = "#1f7ed0",
  fillStart,
  fillEnd,
  showDots = true,
}) {
  if (!values || values.length < 2) return null;

  const pad = 12;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = (max - min) || 1;

  const pts = values.map((v, i) => ({
    x: pad + (i / (values.length - 1)) * w,
    y: pad + ((max - v) / range) * h,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length - 1].x.toFixed(2)},${(pad + h).toFixed(2)} L${pts[0].x.toFixed(2)},${(pad + h).toFixed(2)} Z`;

  const gradId = `grad_${Math.random().toString(36).slice(2, 7)}`;

  return (
    <View>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"   stopColor={fillStart || lineColor} stopOpacity="1" />
            <Stop offset="1"   stopColor={fillEnd   || lineColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {/* Area fill */}
        <Path d={areaPath} fill={`url(#${gradId})`} />
        {/* Line */}
        <Path
          d={linePath}
          stroke={lineColor}
          strokeWidth={2.5}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Dots */}
        {showDots && pts.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={4} fill={lineColor} />
        ))}
      </Svg>
    </View>
  );
}
