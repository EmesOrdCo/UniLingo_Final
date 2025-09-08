import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ConsistentHeader from '../components/ConsistentHeader';
import DailyGoalsWidget from '../components/DailyGoalsWidget';
import VocabularyProgressCard from '../components/VocabularyProgressCard';
import ReviewVocabCard from '../components/ReviewVocabCard';
import CourseProgressCard from '../components/CourseProgressCard';
import LearningStatsCard from '../components/LearningStatsCard';


export default function StudyScreen() {

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Consistent Header */}
      <ConsistentHeader 
        pageName="Progress"
      />
      
      {/* Progress Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Your Courses Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your courses</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <CourseProgressCard 
            onPress={() => console.log('Course progress pressed')}
          />
        </View>

        {/* Learning Stats Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Learning stats</Text>
          </View>
          <View style={styles.statsContainer}>
            <LearningStatsCard value="1" label="Complete lessons" />
            <LearningStatsCard value="0" label="Lessons made" />
            <LearningStatsCard value="0" label="Complete flashcards" />
            <LearningStatsCard value="2 min" label="Learning time" />
          </View>
        </View>

        {/* Your Vocabulary Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your vocabulary</Text>
          </View>
          <VocabularyProgressCard 
            onPress={() => console.log('Vocabulary progress pressed')}
          />
        </View>

        {/* Review Vocab Section */}
        <View style={styles.section}>
          <ReviewVocabCard 
            onPress={() => console.log('Review vocab pressed')}
          />
        </View>

        {/* Daily Goals Widget */}
        <View style={styles.dailyGoalsSection}>
          <DailyGoalsWidget />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  dailyGoalsSection: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  seeAllText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
