import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LearningActivitySequenceProps {
  onActivityPress?: (activity: string) => void;
}

const LearningActivitySequence: React.FC<LearningActivitySequenceProps> = ({ onActivityPress }) => {
  const activities = [
    {
      id: 'words',
      title: 'Words',
      icon: 'library-outline',
      color: '#f97316',
      bgColor: '#fff7ed',
      borderColor: '#fed7aa',
    },
    {
      id: 'listen',
      title: 'Listen',
      icon: 'volume-high-outline',
      color: '#10b981',
      bgColor: '#f0fdf4',
      borderColor: '#bbf7d0',
    },
    {
      id: 'write',
      title: 'Write',
      icon: 'create-outline',
      color: '#f59e0b',
      bgColor: '#fffbeb',
      borderColor: '#fed7aa',
    },
    {
      id: 'speak',
      title: 'Speak',
      icon: 'mic-outline',
      color: '#ef4444',
      bgColor: '#fef2f2',
      borderColor: '#fecaca',
    },
    {
      id: 'conversation',
      title: 'Conversation',
      icon: 'chatbubbles-outline',
      color: '#8b5cf6',
      bgColor: '#faf5ff',
      borderColor: '#e9d5ff',
    },
    {
      id: 'roleplay',
      title: 'Roleplay',
      icon: 'people-outline',
      color: '#ec4899',
      bgColor: '#fdf2f8',
      borderColor: '#fce7f3',
    },
  ];

  const handleActivityPress = (activity: string) => {
    if (onActivityPress) {
      onActivityPress(activity);
    }
  };

  return (
    <View style={styles.container}>
      {activities.map((activity, index) => (
        <View key={activity.id} style={styles.activityContainer}>
          {/* Connection line */}
          {index > 0 && <View style={styles.connectionLine} />}
          
          {/* Activity node */}
          <View style={styles.activityNode}>
            <View style={[styles.nodeCircle, { backgroundColor: activity.color }]}>
              <Ionicons name={activity.icon as any} size={16} color="#ffffff" />
            </View>
          </View>
          
          {/* Activity button */}
          <TouchableOpacity
            style={[
              styles.activityButton,
              {
                backgroundColor: activity.bgColor,
                borderColor: activity.borderColor,
              }
            ]}
            onPress={() => handleActivityPress(activity.id)}
          >
            <View style={[styles.activityIcon, { backgroundColor: activity.color }]}>
              <Ionicons name={activity.icon as any} size={20} color="#ffffff" />
            </View>
            <Text style={[styles.activityTitle, { color: activity.color }]}>
              {activity.title}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  activityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  connectionLine: {
    position: 'absolute',
    left: 19,
    top: -16,
    width: 2,
    height: 16,
    backgroundColor: '#e5e7eb',
    zIndex: 1,
  },
  activityNode: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  nodeCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginLeft: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LearningActivitySequence;
