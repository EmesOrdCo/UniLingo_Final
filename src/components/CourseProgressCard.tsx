import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

interface CourseProgressCardProps {
  onPress?: () => void;
}

export default function CourseProgressCard({ onPress }: CourseProgressCardProps) {
  // Mock data - in a real app, this would come from your data service
  const courseData = {
    level: "A1.1",
    title: "Newcomer I (A1.1)",
    progress: 2,
    badge: "A1"
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{courseData.badge}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.level}>{courseData.level}</Text>
        <Text style={styles.title}>{courseData.title}</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${courseData.progress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{courseData.progress}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1f2937',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f2937',
  },
  content: {
    gap: 8,
  },
  level: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    minWidth: 30,
  },
});
