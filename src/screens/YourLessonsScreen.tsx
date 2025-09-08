import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { LessonService, Lesson } from '../lib/lessonService';
import ConsistentHeader from '../components/ConsistentHeader';

export default function YourLessonsScreen() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  
  const navigation = useNavigation();
  const { user } = useAuth();

  // Fetch user's lessons when component comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUserLessons();
    }, [user])
  );

  const fetchUserLessons = async () => {
    if (!user) {
      setLoadingLessons(false);
      return;
    }

    try {
      setLoadingLessons(true);
      const userLessons = await LessonService.getUserLessons(user.id);
      setLessons(userLessons);
      console.log(`✅ Fetched ${userLessons.length} lessons for user`);
    } catch (error) {
      console.error('❌ Error fetching user lessons:', error);
      setLessons([]);
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleCreateLesson = () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create lessons.');
      return;
    }
    
    // Navigate to CreateLesson screen
    navigation.navigate('CreateLesson' as never);
  };

  const handleLessonPress = async (lesson: Lesson) => {
    // Navigate to lesson walkthrough
    (navigation as any).navigate('LessonWalkthrough', {
      lessonId: lesson.id,
      lessonTitle: lesson.title
    });
  };

  const handleDeleteLesson = async (lesson: Lesson) => {
    Alert.alert(
      'Delete Lesson',
      `Are you sure you want to delete "${lesson.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await LessonService.deleteLesson(lesson.id);
              await fetchUserLessons(); // Refresh the list
              console.log(`✅ Deleted lesson: ${lesson.title}`);
            } catch (error) {
              console.error('❌ Error deleting lesson:', error);
              Alert.alert('Error', 'Failed to delete lesson. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getSubjectColor = (subject: string) => {
    const colors: { [key: string]: string } = {
      'Medicine': '#ef4444',
      'Engineering': '#3b82f6',
      'Business': '#10b981',
      'Computer Science': '#8b5cf6',
      'Media Studies': '#f59e0b',
      'General': '#6b7280'
    };
    return colors[subject] || colors['General'];
  };

  if (loadingLessons) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ConsistentHeader pageName="Your Lessons" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading your lessons...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ConsistentHeader pageName="Your Lessons" showBackButton={true} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Back to AI Lessons Button */}
        <TouchableOpacity 
          style={styles.backToLessonsButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#6366f1" />
          <Text style={styles.backToLessonsText}>Back to AI Lessons</Text>
        </TouchableOpacity>

        {lessons.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Lessons Yet</Text>
            <Text style={styles.emptyText}>
              Upload a PDF to create your first lesson and start learning English terminology!
            </Text>
            
            {/* AI-Powered Lessons Section */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>AI-Powered Vocabulary Lessons</Text>
              <Text style={styles.cardDescription}>
                Upload your course notes and let AI create an interactive vocabulary lesson 
                with flashcards and games. Perfect for learning subject-specific English terminology.
              </Text>
            </View>

            {/* Create Your Lesson Section */}
            <View style={styles.card}>
              <View style={styles.lessonIconContainer}>
                <Ionicons name="document-text" size={64} color="#6366f1" />
              </View>
              <Text style={styles.cardTitle}>Create Your First Lesson</Text>
              <Text style={styles.cardDescription}>
                Upload PDF course notes to generate an interactive vocabulary lesson
              </Text>
              <TouchableOpacity 
                style={styles.mainCreateButton}
                onPress={handleCreateLesson}
              >
                <Ionicons name="cloud-upload" size={20} color="#ffffff" />
                <Text style={styles.createButtonText}>Choose PDF File</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.lessonsContainer}>
            {/* Lessons Header */}
            <View style={styles.lessonsHeader}>
              <Text style={styles.lessonsTitle}>{lessons.length} lessons created</Text>
              <View style={styles.headerButtons}>
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={fetchUserLessons}
                  disabled={loadingLessons}
                >
                  <Ionicons 
                    name="refresh" 
                    size={16} 
                    color={loadingLessons ? "#94a3b8" : "#6366f1"} 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.addLessonButton}
                  onPress={handleCreateLesson}
                >
                  <Ionicons name="add" size={20} color="#ffffff" />
                  <Text style={styles.addLessonButtonText}>New Lesson</Text>
                </TouchableOpacity>
              </View>
            </View>

            {lessons.map((lesson, index) => (
              <TouchableOpacity
                key={lesson.id}
                style={styles.lessonCard}
                onPress={() => handleLessonPress(lesson)}
                activeOpacity={0.7}
              >
                {/* Delete Button - Top Right */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteLesson(lesson)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>

                {/* Lesson Header with Icon */}
                <View style={styles.lessonHeader}>
                  <View style={styles.lessonIconContainer}>
                    <View style={[
                      styles.lessonIcon,
                      { backgroundColor: getSubjectColor(lesson.subject) }
                    ]}>
                      <Ionicons name="book-outline" size={20} color="#ffffff" />
                    </View>
                  </View>
                  <View style={styles.lessonInfo}>
                    <Text style={styles.lessonTitle} numberOfLines={2}>
                      {lesson.title}
                    </Text>
                    <Text style={styles.lessonDate}>
                      Created {new Date(lesson.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                
                {/* Lesson Details - Single Line */}
                <View style={styles.lessonDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="time-outline" size={14} color="#6366f1" />
                    <Text style={styles.detailText}>{lesson.estimated_duration} min</Text>
                  </View>
                  <View style={styles.detailSeparator} />
                  <View style={styles.detailItem}>
                    <Ionicons name="trending-up-outline" size={14} color="#6366f1" />
                    <Text style={styles.detailText}>{lesson.difficulty_level}</Text>
                  </View>
                  <View style={styles.detailSeparator} />
                  <View style={styles.detailItem}>
                    <Ionicons name="document-text-outline" size={14} color="#6366f1" />
                    <Text style={styles.detailText} numberOfLines={1}>
                      {lesson.source_pdf_name}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar Placeholder */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '0%' }]} />
                  </View>
                  <Text style={styles.progressText}>Not started</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  backToLessonsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  backToLessonsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  lessonIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mainCreateButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  lessonsContainer: {
    paddingTop: 20,
  },
  lessonsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  lessonsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  addLessonButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addLessonButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  lessonCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    position: 'relative',
  },
  deleteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    zIndex: 1,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  lessonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
    lineHeight: 22,
  },
  lessonDate: {
    fontSize: 12,
    color: '#64748b',
  },
  lessonDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  detailSeparator: {
    width: 1,
    height: 12,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    minWidth: 80,
  },
});
