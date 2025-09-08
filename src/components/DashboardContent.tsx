import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import LearningActivitySequence from './LearningActivitySequence';

interface DashboardContentProps {
  progressData: any;
  loadingProgress: boolean;
}

export default function DashboardContent({ progressData, loadingProgress }: DashboardContentProps) {
  const handleActivityPress = (activity: string) => {
    console.log(`Activity pressed: ${activity}`);
    // TODO: Navigate to specific activity or show activity details
  };

  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Learning Activity Sequence - Repeating structure */}
      <LearningActivitySequence onActivityPress={handleActivityPress} />
      
      {/* Additional Learning Activity Sequence - Repeat the pattern */}
      <LearningActivitySequence onActivityPress={handleActivityPress} />
      
      {/* Third Learning Activity Sequence - Continue the pattern */}
      <LearningActivitySequence onActivityPress={handleActivityPress} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 20,
  },
});
