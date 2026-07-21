import React from 'react';
import { View } from 'react-native';
import styles from '../assets/styles/question.styles';

export default function BubbleBackground({ variant = 'colorful' }) {
  const isSubtle = variant === 'subtle';

  return (
    <View pointerEvents="none" style={styles.questionBackdrop}>
      <View style={styles.backdropLayerA} />
      <View style={styles.backdropLayerB} />
      
      {!isSubtle && (
        <>
          <View style={[styles.backdropColorBlob, styles.backdropColorBlobPink]} />
          <View style={[styles.backdropColorBlob, styles.backdropColorBlobTeal]} />
          <View style={[styles.backdropColorBlob, styles.backdropColorBlobGold]} />
        </>
      )}

      {!isSubtle && <View style={[styles.backdropSpark, styles.backdropSparkOne]} />}
      <View style={[styles.backdropSpark, styles.backdropSparkTwo]} />
      {!isSubtle && <View style={[styles.backdropSpark, styles.backdropSparkThree]} />}
      
      <View style={[styles.backdropBubble, styles.backdropBubbleTopRight]} />
      {!isSubtle && <View style={[styles.backdropBubble, styles.backdropBubbleTopLeft]} />}
      <View style={[styles.backdropBubble, styles.backdropBubbleUpperMid]} />
      {!isSubtle && <View style={[styles.backdropBubble, styles.backdropBubbleBottomLeft]} />}
      <View style={[styles.backdropBubble, styles.backdropBubbleBottomRight]} />
      <View style={[styles.backdropBubble, styles.backdropBubbleCenter]} />
      {!isSubtle && <View style={[styles.backdropBubble, styles.backdropBubbleLowerMid]} />}
      <View style={[styles.backdropBubble, styles.backdropBubbleTinyTop]} />
      {!isSubtle && <View style={[styles.backdropBubble, styles.backdropBubbleTinyBottom]} />}

      {/* New Middle Bubbles */}
      <View style={[styles.backdropBubble, styles.backdropBubbleMidRight]} />
      <View style={[styles.backdropBubble, styles.backdropBubbleMidLeft]} />
      <View style={[styles.backdropBubble, styles.backdropBubbleMidCenter]} />
    </View>
  );
}
