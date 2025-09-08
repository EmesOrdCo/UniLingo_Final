import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { UserFlashcardService } from '../lib/userFlashcardService';
import { FlashcardService } from '../lib/flashcardService';
import { supabase } from '../lib/supabase';
import ConsistentHeader from '../components/ConsistentHeader';
import DailyChallengeSection from '../components/DailyChallengeSection';
import AllGamesSection from '../components/AllGamesSection';
import FlashcardQuizGame from '../components/games/FlashcardQuizGame';
import MemoryMatchGame from '../components/games/MemoryMatchGame';
import WordScrambleGame from '../components/games/WordScrambleGame';
import HangmanGame from '../components/games/HangmanGame';
import GravityGame from '../components/games/GravityGame';
import TypeWhatYouHearGame from '../components/games/TypeWhatYouHearGame';
import SentenceScrambleGame from '../components/games/SentenceScrambleGame';
import SpeedChallengeGame from '../components/games/SpeedChallengeGame';

const { width } = Dimensions.get('window');

export default function GamesScreen() {
  const navigation = useNavigation();
  const { user, profile } = useAuth();
  
  // State for games and data
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [gameStats, setGameStats] = useState({
    gamesPlayed: 0,
    totalScore: 0,
    bestScore: 0,
    averageScore: 0,
    timeSpent: 0,
  });
  
  
  // Game state
  const [showGameModal, setShowGameModal] = useState(false);
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [gameData, setGameData] = useState<any>(null);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [showQuizSetup, setShowQuizSetup] = useState(false);
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(10);
  const [selectedLanguageMode, setSelectedLanguageMode] = useState<'question' | 'answer'>('question');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);
  const [difficulties, setDifficulties] = useState([
    { id: 'beginner', name: 'Beginner', description: 'Easy', color: '#10b981' },
    { id: 'intermediate', name: 'Intermediate', description: 'Medium', color: '#f59e0b' },
    { id: 'advanced', name: 'Advanced', description: 'Hard', color: '#dc2626' },
  ]);
  
  
  // Flashcard creation state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFlashcard, setNewFlashcard] = useState({
    topic: '',
    front: '',
    back: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'expert',
    example: '',
    pronunciation: '',
    tags: [] as string[],
    native_language: 'english'
  });
  const [showTopicInput, setShowTopicInput] = useState(false);
  const [newTopicInput, setNewTopicInput] = useState('');
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  
  // Flashcard review state
  const [studySession, setStudySession] = useState<{
    isActive: boolean;
    isComplete: boolean;
    flashcards: any[];
    currentIndex: number;
    showAnswer: boolean;
    answers: Array<'correct' | 'incorrect'>;
    showNativeLanguage: boolean;
    startTime: Date | null;
  }>({
    isActive: false,
    isComplete: false,
    flashcards: [],
    currentIndex: 0,
    showAnswer: false,
    answers: [],
    showNativeLanguage: false,
    startTime: null
  });
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [browseFlashcards, setBrowseFlashcards] = useState<any[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [realFlashcardStats, setRealFlashcardStats] = useState({
    totalCards: 0,
    averageAccuracy: 0,
    bestTopic: ''
  });

  // Fetch flashcards and topics
  useEffect(() => {
    const fetchGameData = async () => {
      if (!user || !profile?.subjects?.[0]) return;
      
      try {
        const userSubject = profile.subjects[0];
        console.log('🎮 Fetching game data for subject:', userSubject);
        
        // Get user's flashcards filtered by subject
        const userFlashcards = await UserFlashcardService.getUserFlashcards({ subject: userSubject });
        const userCards = userFlashcards;
        
        // REMOVED: General flashcards table no longer exists - only use user flashcards
        const generalCards: any[] = [];
        
        // Filter valid cards
        const allCards = userCards.filter(card => 
          card.front && card.back && card.topic
        );
        
        setFlashcards(allCards);
        
        // Get unique topics
        const uniqueTopics = Array.from(new Set(allCards.map(card => card.topic)));
        setTopics(uniqueTopics);
        
        // Default to "All Topics" (empty string means all topics)
        setSelectedTopic('');
        
        // Load flashcard stats
        await loadFlashcardStats();
        
        console.log('✅ Game data loaded:', {
          totalCards: allCards.length,
          topics: uniqueTopics.length,
          userCards: userCards.length,
          generalCards: 0 // General flashcards table no longer exists
        });
        
        // Log sample cards
        if (userCards.length > 0) {
          console.log('📝 Sample user card:', userCards[0]);
        }
        
      } catch (error) {
        console.error('❌ Error fetching game data:', error);
        Alert.alert('Error', 'Failed to load game data. Please try again.');
      }
    };

    fetchGameData();
  }, [user, profile]);


  // Flashcard creation functions
  const createFlashcard = async () => {
    if (!user || !profile?.subjects?.[0]) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!newFlashcard.topic || !newFlashcard.front || !newFlashcard.back || !newFlashcard.example) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const userSubject = profile.subjects[0];
      const flashcardData = {
        ...newFlashcard,
        subject: userSubject,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await UserFlashcardService.createUserFlashcard(flashcardData);
      if (error) throw error;

      if (data) {
        Alert.alert('Success', 'Flashcard created successfully!');
        setNewFlashcard({
          topic: '',
          front: '',
          back: '',
          difficulty: 'beginner',
          example: '',
          pronunciation: '',
          tags: [],
          native_language: 'english'
        });
        setShowCreateForm(false);
        
        // Refresh flashcards and topics
        const userFlashcards = await UserFlashcardService.getUserFlashcards({ subject: userSubject });
        const allCards = userFlashcards.filter(card => card.front && card.back && card.topic);
        setFlashcards(allCards);
        
        const uniqueTopics = Array.from(new Set(allCards.map(card => card.topic)));
        setTopics(uniqueTopics);
        
        // Refresh flashcard stats
        await loadFlashcardStats();
      }
    } catch (error) {
      console.error('Error creating flashcard:', error);
      Alert.alert('Error', 'Failed to create flashcard. Please try again.');
    }
  };

  // Load flashcard statistics
  const loadFlashcardStats = async () => {
    try {
      if (!user || !profile?.subjects?.[0]) return;
      
      const userSubject = profile.subjects[0];
      const userFlashcards = await UserFlashcardService.getUserFlashcards({ subject: userSubject });
      
      setRealFlashcardStats({
        totalCards: userFlashcards.length,
        averageAccuracy: 75, // Placeholder - would need to calculate from actual performance data
        bestTopic: userFlashcards.length > 0 ? userFlashcards[0].topic : 'No cards yet'
      });
    } catch (error) {
      console.error('Error loading flashcard stats:', error);
    }
  };

  // Start review session
  const startReviewSession = async () => {
    try {
      if (!user || !profile?.subjects?.[0]) return;
      
      const userSubject = profile.subjects[0];
      const userFlashcards = await UserFlashcardService.getUserFlashcards({ subject: userSubject });
      const validCards = userFlashcards.filter(card => card.front && card.back && card.topic);
      
      if (validCards.length === 0) {
        Alert.alert('No Cards', 'You don\'t have any flashcards to review yet.');
        return;
      }
      
      setStudySession({
        isActive: true,
        isComplete: false,
        flashcards: validCards,
        currentIndex: 0,
        showAnswer: false,
        answers: [],
        showNativeLanguage: false,
        startTime: new Date()
      });
    } catch (error) {
      console.error('Error starting review session:', error);
      Alert.alert('Error', 'Failed to start review session.');
    }
  };

  // Load browse flashcards
  const loadBrowseFlashcards = async () => {
    try {
      setBrowseLoading(true);
      if (!user || !profile?.subjects?.[0]) return;
      
      const userSubject = profile.subjects[0];
      const userFlashcards = await UserFlashcardService.getUserFlashcards({ subject: userSubject });
      setBrowseFlashcards(userFlashcards);
      setShowBrowseModal(true);
    } catch (error) {
      console.error('Error loading browse flashcards:', error);
      Alert.alert('Error', 'Failed to load flashcards.');
    } finally {
      setBrowseLoading(false);
    }
  };

  // Audio functions
  const playPronunciation = async (text: string) => {
    try {
      if (isAudioPlaying) {
        await Speech.stop();
        setIsAudioPlaying(false);
        return;
      }
      
      setIsAudioPlaying(true);
      await Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.8,
        onDone: () => setIsAudioPlaying(false),
        onError: () => setIsAudioPlaying(false),
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsAudioPlaying(false);
    }
  };

  // Study session functions
  const toggleLanguage = () => {
    setStudySession(prev => ({ ...prev, showNativeLanguage: !prev.showNativeLanguage }));
  };

  const showAnswer = () => {
    setStudySession(prev => ({ ...prev, showAnswer: true }));
  };

  const nextCard = (answer: 'correct' | 'incorrect') => {
    setStudySession(prev => {
      const newAnswers = [...prev.answers, answer];
      const nextIndex = prev.currentIndex + 1;
      
      if (nextIndex >= prev.flashcards.length) {
        return {
          ...prev,
          isComplete: true,
          answers: newAnswers
        };
      }
      
      return {
        ...prev,
        currentIndex: nextIndex,
        showAnswer: false,
        answers: newAnswers
      };
    });
  };

  const restartSession = () => {
    setStudySession(prev => ({
      ...prev,
      isActive: false,
      isComplete: false,
      currentIndex: 0,
      showAnswer: false,
      answers: [],
      startTime: null
    }));
  };


  // Get filtered card count based on current selection
  const getFilteredCardCount = () => {
    let topicCards = flashcards;
    
    if (selectedTopic) {
      topicCards = topicCards.filter(card => card.topic === selectedTopic);
    }
    
    if (selectedDifficulty) {
      topicCards = topicCards.filter(card => card.difficulty === selectedDifficulty);
    }
    
    // If current selection exceeds available cards, adjust to max available
    if (selectedQuestionCount > topicCards.length) {
      const maxAvailable = Math.max(5, Math.floor(topicCards.length / 5) * 5);
      setSelectedQuestionCount(Math.min(maxAvailable, topicCards.length));
    }
    
    return topicCards.length;
  };


  // Game start functions
  const startFlashcardQuiz = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please add some flashcards first.');
      return;
    }
    setShowQuizSetup(true);
  };

  const startMemoryMatch = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please add some flashcards first.');
      return;
    }
    setCurrentGame('Memory Match');
    setGameData({ flashcards: flashcards.slice(0, 12) });
    setShowGameModal(true);
  };

  const startWordScramble = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please add some flashcards first.');
      return;
    }
    setCurrentGame('Word Scramble');
    setGameData({ flashcards: flashcards.slice(0, 10) });
    setShowGameModal(true);
  };

  const startHangman = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please add some flashcards first.');
      return;
    }
    setCurrentGame('Hangman');
    setGameData({ flashcards: flashcards.slice(0, 10) });
    setShowGameModal(true);
  };

  const startSpeedChallenge = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please add some flashcards first.');
      return;
    }
    setCurrentGame('Speed Challenge');
    setGameData({ flashcards: flashcards.slice(0, 20) });
    setShowGameModal(true);
  };

  const startGravityGame = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please add some flashcards first.');
      return;
    }
    setCurrentGame('Planet Defense');
    setGameData({ flashcards: flashcards.slice(0, 15) });
    setShowGameModal(true);
  };

  const startTypeWhatYouHear = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please add some flashcards first.');
      return;
    }
    setCurrentGame('Type What You Hear');
    setGameData({ flashcards: flashcards.slice(0, 10) });
    setShowGameModal(true);
  };

  const startSentenceScramble = () => {
    if (flashcards.length === 0) {
      Alert.alert('No Cards Available', 'Please add some flashcards first.');
      return;
    }
    setCurrentGame('Sentence Scramble');
    setGameData({ flashcards: flashcards.slice(0, 10) });
    setShowGameModal(true);
  };

  // Handle game completion
  const handleGameComplete = (finalScore: number) => {
    setShowGameModal(false);
    setCurrentGame(null);
    setGameData(null);
    
    // Update game stats
    setGameStats(prev => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      totalScore: prev.totalScore + finalScore,
      bestScore: Math.max(prev.bestScore, finalScore),
      averageScore: Math.round((prev.totalScore + finalScore) / (prev.gamesPlayed + 1)),
    }));
    
    Alert.alert(
      'Game Complete! 🎉',
      `Final Score: ${finalScore}`,
      [{ text: 'OK' }]
    );
  };

  // Close game modal
  const closeGameModal = () => {
    setShowGameModal(false);
    setCurrentGame(null);
    setGameData(null);
  };

  // Render game component based on current game
  const renderGameComponent = () => {
    if (!currentGame || !gameData) return null;

    const gameProps = {
      gameData,
      onClose: closeGameModal,
      onGameComplete: handleGameComplete,
      userProfile: profile,
    };

    switch (currentGame) {
      case 'Flashcard Quiz':
        return <FlashcardQuizGame {...gameProps} />;
      case 'Memory Match':
        return <MemoryMatchGame {...gameProps} />;
      case 'Word Scramble':
        return <WordScrambleGame {...gameProps} />;
      case 'Hangman':
        return <HangmanGame {...gameProps} />;
      case 'Speed Challenge':
        return <SpeedChallengeGame {...gameProps} />;
      case 'Planet Defense':
        return <GravityGame {...gameProps} />;
      case 'Type What You Hear':
        return <TypeWhatYouHearGame {...gameProps} />;
      case 'Sentence Scramble':
        return <SentenceScrambleGame {...gameProps} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ConsistentHeader 
        pageName="Games"
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Daily Challenge */}
        <DailyChallengeSection onPlay={() => startFlashcardQuiz()} />
        
        {/* Create Flashcard Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => setShowCreateForm(!showCreateForm)}
            >
              <Ionicons name="add-circle" size={24} color="#6366f1" />
              <Text style={styles.sectionTitle}>Create Your Own</Text>
              <Ionicons 
                name={showCreateForm ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#64748b" 
              />
            </TouchableOpacity>
          </View>
          
          {!showCreateForm ? (
            <>
              <Text style={styles.sectionDescription}>
                Add new flashcards to your personal collection
              </Text>
              <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateForm(true)}>
                <Ionicons name="add" size={24} color="#6366f1" />
                <Text style={styles.createButtonText}>Create New Flashcard</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.uploadNotesButton} onPress={() => navigation.navigate('Upload' as never)}>
                <Ionicons name="document-text" size={24} color="#10b981" />
                <Text style={styles.uploadNotesButtonText}>Upload Notes to Create Flashcards with AI</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.createForm}>
              {/* Topic selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Topic</Text>
                {!showTopicInput ? (
                  <View style={styles.createFormTopicSelectionContainer}>
                    <TouchableOpacity
                      style={styles.createFormTopicDropdown}
                      onPress={() => setShowTopicPicker(!showTopicPicker)}
                    >
                      <Text style={styles.topicDropdownText}>
                        {newFlashcard.topic || 'Select a topic'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#64748b" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.newTopicButton}
                      onPress={() => setShowTopicInput(true)}
                    >
                      <Ionicons name="add" size={16} color="#6366f1" />
                      <Text style={styles.newTopicButtonText}>New Topic</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.newTopicInputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter new topic name"
                      value={newTopicInput}
                      onChangeText={setNewTopicInput}
                    />
                    <View style={styles.newTopicActions}>
                      <TouchableOpacity style={styles.cancelButton} onPress={() => {
                        setShowTopicInput(false);
                        setNewTopicInput('');
                      }}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.confirmButton} onPress={() => {
                        if (newTopicInput.trim()) {
                          setNewFlashcard(prev => ({ ...prev, topic: newTopicInput.trim() }));
                          setShowTopicInput(false);
                          setNewTopicInput('');
                        }
                      }}>
                        <Text style={styles.confirmButtonText}>Use New Topic</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                
                {/* Topic dropdown options */}
                {!showTopicInput && showTopicPicker && (
                  <ScrollView style={styles.topicOptionsContainer}>
                    {(topics || []).map((topic) => (
                      <TouchableOpacity
                        key={topic}
                        style={styles.topicOption}
                        onPress={() => {
                          setNewFlashcard(prev => ({ ...prev, topic: topic }));
                          setShowTopicPicker(false);
                        }}
                      >
                        <Text style={styles.topicOptionText}>{topic}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Front Text Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Front (Question/Term) *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newFlashcard.front}
                  onChangeText={(text) => setNewFlashcard(prev => ({ ...prev, front: text }))}
                  placeholder="Enter the question or term"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Back Text Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Back (Answer/Definition) *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newFlashcard.back}
                  onChangeText={(text) => setNewFlashcard(prev => ({ ...prev, back: text }))}
                  placeholder="Enter the answer or definition"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Example Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Example *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newFlashcard.example}
                  onChangeText={(text) => setNewFlashcard(prev => ({ ...prev, example: text }))}
                  placeholder="Provide an example sentence using the front term"
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Pronunciation Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Pronunciation (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={newFlashcard.pronunciation}
                  onChangeText={(text) => setNewFlashcard(prev => ({ ...prev, pronunciation: text }))}
                  placeholder="e.g., /kɑːrˈdiːə/ for 'cardiac'"
                />
              </View>

              {/* Difficulty Selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Difficulty Level *</Text>
                <View style={styles.difficultyContainer}>
                  {['beginner', 'intermediate', 'expert'].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.difficultyButton,
                        newFlashcard.difficulty === level && styles.selectedDifficulty,
                        { borderColor: level === 'beginner' ? '#10b981' : level === 'intermediate' ? '#f59e0b' : '#ef4444' }
                      ]}
                      onPress={() => setNewFlashcard(prev => ({ ...prev, difficulty: level as 'beginner' | 'intermediate' | 'expert' }))}
                    >
                      <Text style={[
                        styles.difficultyText,
                        newFlashcard.difficulty === level && styles.selectedDifficultyText,
                        { color: newFlashcard.difficulty === level ? '#ffffff' : level === 'beginner' ? '#10b981' : level === 'intermediate' ? '#f59e0b' : '#ef4444' }
                      ]}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.formActions}>
                <TouchableOpacity style={styles.cancelFormButton} onPress={() => {
                  setShowCreateForm(false);
                  setNewFlashcard({
                    topic: '',
                    front: '',
                    back: '',
                    difficulty: 'beginner',
                    example: '',
                    pronunciation: '',
                    tags: [],
                    native_language: 'english'
                  });
                }}>
                  <Text style={styles.cancelFormButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={createFlashcard}>
                  <Text style={styles.saveButtonText}>Create Flashcard</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Review Flashcards Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="library" size={24} color="#10b981" />
            <Text style={styles.sectionTitle}>Review Your Flashcards</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Browse and review all your created flashcards
          </Text>
          
          <View style={styles.reviewFlashcardsCard}>
            <View style={styles.reviewStatsRow}>
              <View style={styles.reviewStatItem}>
                <Ionicons name="book" size={20} color="#10b981" />
                <Text style={styles.reviewStatNumber}>{realFlashcardStats.totalCards}</Text>
                <Text style={styles.reviewStatLabel}>Total Cards</Text>
              </View>
              <View style={styles.reviewStatItem}>
                <Ionicons name="bookmark" size={20} color="#6366f1" />
                <Text style={styles.reviewStatNumber}>{topics.length}</Text>
                <Text style={styles.reviewStatLabel}>Topics</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.reviewButton}
              onPress={() => {
                if (realFlashcardStats.totalCards > 0) {
                  // Start a review session with all user flashcards
                  startReviewSession();
                } else {
                  Alert.alert(
                    'No Flashcards Yet',
                    'You haven\'t created any flashcards yet. Create some flashcards first or upload notes to generate them with AI.',
                    [{ text: 'OK' }]
                  );
                }
              }}
            >
              <Ionicons name="play-circle" size={24} color="#ffffff" />
              <Text style={styles.reviewButtonText}>
                {realFlashcardStats.totalCards > 0 ? 'Start Review Session' : 'No Cards to Review'}
              </Text>
            </TouchableOpacity>
            
            {realFlashcardStats.totalCards > 0 && (
              <TouchableOpacity 
                style={styles.browseButton}
                onPress={loadBrowseFlashcards}
                disabled={browseLoading}
              >
                <Ionicons name="list" size={20} color="#6366f1" />
                <Text style={styles.browseButtonText}>Browse All Cards</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* All Games - 2x4 Grid */}
        <AllGamesSection 
          games={[
            { name: 'Flashcard Quiz', tag: 'Quiz', icon: 'help-circle', color: '#6366f1', bgColor: '#f0f4ff', onPress: startFlashcardQuiz },
            { name: 'Memory Match', tag: 'Memory', icon: 'grid', color: '#10b981', bgColor: '#f0fdf4', onPress: startMemoryMatch },
            { name: 'Word Scramble', tag: 'Puzzle', icon: 'text', color: '#16a34a', bgColor: '#f0fdf4', onPress: startWordScramble },
            { name: 'Hangman', tag: 'Word Game', icon: 'game-controller', color: '#8b5cf6', bgColor: '#f8fafc', onPress: startHangman },
            { name: 'Speed Challenge', tag: 'Speed', icon: 'timer', color: '#dc2626', bgColor: '#fef2f2', onPress: startSpeedChallenge },
            { name: 'Planet Defense', tag: 'Arcade', icon: 'planet', color: '#3b82f6', bgColor: '#dbeafe', onPress: startGravityGame },
            { name: 'Type What You Hear', tag: 'Listening', icon: 'ear', color: '#8b5cf6', bgColor: '#f3e8ff', onPress: startTypeWhatYouHear },
            { name: 'Sentence Scramble', tag: 'Grammar', icon: 'document-text', color: '#ec4899', bgColor: '#fdf2f8', onPress: startSentenceScramble },
          ].map((game) => ({
            id: game.name,
            title: game.name,
            tag: game.tag,
            cards: getFilteredCardCount(),
            progress: 0.2,
            icon: game.icon,
            isFavorite: false,
            onPlay: game.onPress
          }))}
          onToggleFavorite={() => {}}
        />
      </ScrollView>
      
      {/* Quiz Setup Modal */}
      <Modal
        visible={showQuizSetup}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQuizSetup(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowQuizSetup(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Quiz Setup</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.modalContent}>
            {/* Topic Selection */}
            <View style={styles.setupSection}>
              <Text style={styles.setupSectionTitle}>Select Topic</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setShowTopicDropdown(!showTopicDropdown)}
              >
                <Text style={styles.dropdownButtonText}>
                  {selectedTopic || 'All Topics'}
                </Text>
                <Ionicons 
                  name={showTopicDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#64748b" 
                />
              </TouchableOpacity>
              
              {showTopicDropdown && (
                <View style={styles.dropdownMenu}>
                  <TouchableOpacity 
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedTopic('');
                      setShowTopicDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>All Topics</Text>
                  </TouchableOpacity>
                  {topics.map((topic) => (
                    <TouchableOpacity 
                      key={topic}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedTopic(topic);
                        setShowTopicDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{topic}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Difficulty Selection */}
            <View style={styles.setupSection}>
              <Text style={styles.setupSectionTitle}>Select Difficulty</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => setShowDifficultyDropdown(!showDifficultyDropdown)}
              >
                <Text style={styles.dropdownButtonText}>
                  {selectedDifficulty || 'All Difficulties'}
                </Text>
                <Ionicons 
                  name={showDifficultyDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#64748b" 
                />
              </TouchableOpacity>
              
              {showDifficultyDropdown && (
                <View style={styles.dropdownMenu}>
                  <TouchableOpacity 
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedDifficulty('');
                      setShowDifficultyDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>All Difficulties</Text>
                  </TouchableOpacity>
                  {difficulties.map((difficulty) => (
                    <TouchableOpacity 
                      key={difficulty.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedDifficulty(difficulty.id);
                        setShowDifficultyDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{difficulty.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Question Count */}
            <View style={styles.setupSection}>
              <Text style={styles.setupSectionTitle}>Number of Questions</Text>
              <View style={styles.questionCountContainer}>
                <TouchableOpacity 
                  style={styles.countButton}
                  onPress={() => setSelectedQuestionCount(Math.max(5, selectedQuestionCount - 5))}
                  disabled={selectedQuestionCount <= 5}
                >
                  <Ionicons name="remove" size={20} color="#64748b" />
                </TouchableOpacity>
                <Text style={styles.questionCountText}>{selectedQuestionCount}</Text>
                <TouchableOpacity 
                  style={styles.countButton}
                  onPress={() => setSelectedQuestionCount(Math.min(50, selectedQuestionCount + 5))}
                  disabled={selectedQuestionCount >= 50}
                >
                  <Ionicons name="add" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Language Mode */}
            <View style={styles.setupSection}>
              <Text style={styles.setupSectionTitle}>Language Mode</Text>
              <View style={styles.languageModeContainer}>
                <TouchableOpacity 
                  style={[
                    styles.languageModeButton,
                    selectedLanguageMode === 'question' && styles.languageModeButtonActive
                  ]}
                  onPress={() => setSelectedLanguageMode('question')}
                >
                  <Text style={[
                    styles.languageModeButtonText,
                    selectedLanguageMode === 'question' && styles.languageModeButtonTextActive
                  ]}>
                    Question → Answer
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.languageModeButton,
                    selectedLanguageMode === 'answer' && styles.languageModeButtonActive
                  ]}
                  onPress={() => setSelectedLanguageMode('answer')}
                >
                  <Text style={[
                    styles.languageModeButtonText,
                    selectedLanguageMode === 'answer' && styles.languageModeButtonTextActive
                  ]}>
                    Answer → Question
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Start Button */}
            <TouchableOpacity 
              style={styles.startButton}
              onPress={() => {
                setShowQuizSetup(false);
                startFlashcardQuiz();
              }}
            >
              <Text style={styles.startButtonText}>Start Quiz</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Game Modal */}
      <Modal
        visible={showGameModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeGameModal}
      >
        <SafeAreaView style={styles.gameModalContainer}>
          <View style={styles.gameModalHeader}>
            <TouchableOpacity onPress={closeGameModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.gameModalTitle}>{currentGame}</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.gameModalContent}>
            {renderGameComponent()}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Study Session Modal */}
      {studySession.isActive && (
        <Modal
          visible={studySession.isActive}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setStudySession(prev => ({ ...prev, isActive: false }))}
        >
          <SafeAreaView style={styles.studyContainer} edges={['top']}>
            {studySession.isComplete ? (
              // Review Session Complete
              <View style={styles.reviewContainer}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewTitle}>Session Complete!</Text>
                  <Text style={styles.reviewSubtitle}>Review your performance</Text>
                  
                  <View style={styles.scoreContainer}>
                    <View style={styles.scoreCircle}>
                      <Text style={styles.scorePercentage}>
                        {Math.round((studySession.answers.filter(a => a === 'correct').length / studySession.answers.length) * 100)}%
                      </Text>
                      <Text style={styles.scoreText}>
                        {studySession.answers.filter(a => a === 'correct').length}/{studySession.answers.length} correct
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Ionicons name="checkmark" size={24} color="#10b981" />
                      <Text style={styles.reviewStatNumber}>{studySession.answers.filter(a => a === 'correct').length}</Text>
                      <Text style={styles.reviewStatLabel}>Correct</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="close" size={24} color="#ef4444" />
                      <Text style={styles.reviewStatNumber}>{studySession.answers.filter(a => a === 'incorrect').length}</Text>
                      <Text style={styles.reviewStatLabel}>Incorrect</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.reviewActions}>
                  <TouchableOpacity style={styles.restartButton} onPress={restartSession}>
                    <Text style={styles.restartButtonText}>Start New Session</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.closeReviewButton} onPress={() => setStudySession(prev => ({ ...prev, isActive: false }))}>
                    <Text style={styles.closeReviewButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // Active Study Session
              <>
                <View style={styles.studyHeader}>
                  <View style={styles.studyHeaderTop}>
                    <TouchableOpacity 
                      style={styles.backButton}
                      onPress={() => setStudySession(prev => ({ ...prev, isActive: false }))}
                    >
                      <Ionicons name="arrow-back" size={24} color="#6366f1" />
                    </TouchableOpacity>
                    <Text style={styles.studyTitle}>Study Session</Text>
                    <View style={styles.progressContainer}>
                      <Text style={styles.progressText}>
                        {studySession.currentIndex + 1} / {studySession.flashcards.length}
                      </Text>
                      <TouchableOpacity style={styles.languageToggle} onPress={toggleLanguage}>
                        <Ionicons name="language" size={20} color="#6366f1" />
                        <Text style={styles.languageToggleText}>
                          {studySession.showNativeLanguage 
                            ? profile?.native_language || 'Native'
                            : 'EN'
                          }
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${((studySession.currentIndex + 1) / studySession.flashcards.length) * 100}%` }]} />
                  </View>
                </View>
                
                <View style={styles.studyContent}>
                  <View style={styles.flashcard}>
                    <View style={styles.flashcardContent}>
                      <Text style={styles.flashcardText}>
                        {studySession.showAnswer 
                          ? (studySession.showNativeLanguage ? studySession.flashcards[studySession.currentIndex].front : studySession.flashcards[studySession.currentIndex].back)
                          : (studySession.showNativeLanguage ? studySession.flashcards[studySession.currentIndex].back : studySession.flashcards[studySession.currentIndex].front)
                        }
                      </Text>
                      {studySession.flashcards[studySession.currentIndex].pronunciation && (
                        <View style={styles.pronunciationContainer}>
                          <Text style={styles.pronunciation}>{studySession.flashcards[studySession.currentIndex].pronunciation}</Text>
                          <TouchableOpacity 
                            style={[styles.audioButton, isAudioPlaying && styles.audioButtonPlaying]} 
                            onPress={() => playPronunciation(studySession.flashcards[studySession.currentIndex].front)}
                          >
                            <Ionicons name={isAudioPlaying ? "pause" : "volume-high"} size={20} color="#6366f1" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  {!studySession.showAnswer ? (
                    <TouchableOpacity style={styles.showAnswerButton} onPress={showAnswer}>
                      <Text style={styles.showAnswerButtonText}>Show Answer</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.answerButtons}>
                      <TouchableOpacity 
                        style={[styles.answerButton, styles.incorrectButton]} 
                        onPress={() => nextCard('incorrect')}
                      >
                        <Ionicons name="close" size={24} color="#ffffff" />
                        <Text style={styles.answerButtonText}>Incorrect</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.answerButton, styles.correctButton]} 
                        onPress={() => nextCard('correct')}
                      >
                        <Ionicons name="checkmark" size={24} color="#ffffff" />
                        <Text style={styles.answerButtonText}>Correct</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </>
            )}
          </SafeAreaView>
        </Modal>
      )}

      {/* Browse Flashcards Modal */}
      <Modal
        visible={showBrowseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBrowseModal(false)}
      >
        <SafeAreaView style={styles.browseContainer}>
          <View style={styles.browseHeader}>
            <TouchableOpacity onPress={() => setShowBrowseModal(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.browseTitle}>All Flashcards</Text>
            <View style={styles.placeholder} />
          </View>
          
          <ScrollView style={styles.browseContent}>
            {browseLoading ? (
              <Text style={styles.loadingText}>Loading flashcards...</Text>
            ) : (
              browseFlashcards.map((card, index) => (
                <View key={index} style={styles.browseCard}>
                  <View style={styles.browseCardHeader}>
                    <Text style={styles.browseCardTopic}>{card.topic}</Text>
                    <Text style={styles.browseCardDifficulty}>{card.difficulty}</Text>
                  </View>
                  <View style={styles.browseCardContent}>
                    <View style={styles.browseCardSide}>
                      <Text style={styles.browseCardLabel}>Front:</Text>
                      <Text style={styles.browseCardText}>{card.front}</Text>
                    </View>
                    <View style={styles.browseCardSide}>
                      <Text style={styles.browseCardLabel}>Back:</Text>
                      <Text style={styles.browseCardText}>{card.back}</Text>
                    </View>
                    {card.example && (
                      <View style={styles.browseCardSide}>
                        <Text style={styles.browseCardLabel}>Example:</Text>
                        <Text style={styles.browseCardText}>{card.example}</Text>
                      </View>
                    )}
                    {card.pronunciation && (
                      <View style={styles.browseCardSide}>
                        <Text style={styles.browseCardLabel}>Pronunciation:</Text>
                        <Text style={styles.browseCardText}>{card.pronunciation}</Text>
                        <TouchableOpacity 
                          style={styles.browseAudioButton} 
                          onPress={() => playPronunciation(card.front)}
                        >
                          <Ionicons name="volume-high" size={16} color="#6366f1" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    paddingHorizontal: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  setupSection: {
    marginBottom: 24,
  },
  setupSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#1e293b',
  },
  dropdownMenu: {
    marginTop: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1e293b',
  },
  questionCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  countButton: {
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  questionCountText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    minWidth: 40,
    textAlign: 'center',
  },
  languageModeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  languageModeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  languageModeButtonActive: {
    backgroundColor: '#6466E9',
    borderColor: '#6466E9',
  },
  languageModeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  languageModeButtonTextActive: {
    color: '#ffffff',
  },
  startButton: {
    backgroundColor: '#6466E9',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  gameModalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  gameModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  gameModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  gameModalContent: {
    flex: 1,
  },
  // Flashcard styles
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f4ff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    marginBottom: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
    marginLeft: 8,
  },
  uploadNotesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  uploadNotesButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 8,
  },
  createForm: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  createFormTopicSelectionContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  createFormTopicDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  topicDropdownText: {
    fontSize: 16,
    color: '#374151',
  },
  newTopicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  newTopicButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366f1',
    marginLeft: 4,
  },
  newTopicInputContainer: {
    gap: 12,
  },
  newTopicActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  topicOptionsContainer: {
    maxHeight: 200,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginTop: 8,
  },
  topicOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  topicOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  selectedDifficulty: {
    backgroundColor: '#6366f1',
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedDifficultyText: {
    color: '#ffffff',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelFormButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelFormButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  reviewFlashcardsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reviewStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  reviewStatItem: {
    alignItems: 'center',
  },
  reviewStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 4,
  },
  reviewStatLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  browseButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366f1',
    marginLeft: 6,
  },
  // Study session styles
  studyContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  studyHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  studyHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  studyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0f4ff',
    borderRadius: 6,
    gap: 4,
  },
  languageToggleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6366f1',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  studyContent: {
    flex: 1,
    padding: 20,
  },
  flashcard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  flashcardContent: {
    alignItems: 'center',
  },
  flashcardText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 16,
  },
  pronunciationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pronunciation: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  audioButton: {
    padding: 8,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  audioButtonPlaying: {
    backgroundColor: '#e0e7ff',
  },
  showAnswerButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  showAnswerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  answerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  answerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  correctButton: {
    backgroundColor: '#10b981',
  },
  incorrectButton: {
    backgroundColor: '#ef4444',
  },
  answerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Review session styles
  reviewContainer: {
    flex: 1,
    padding: 20,
  },
  reviewHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  reviewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  reviewSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#6366f1',
  },
  scorePercentage: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6366f1',
  },
  scoreText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  reviewStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 8,
  },
  reviewStatLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  reviewActions: {
    gap: 12,
  },
  restartButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  restartButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  closeReviewButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeReviewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  // Browse modal styles
  browseContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  browseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  browseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  browseContent: {
    flex: 1,
    padding: 20,
  },
  browseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  browseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  browseCardTopic: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  browseCardDifficulty: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  browseCardContent: {
    gap: 12,
  },
  browseCardSide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  browseCardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    minWidth: 80,
  },
  browseCardText: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 20,
  },
  browseAudioButton: {
    padding: 4,
    backgroundColor: '#f0f4ff',
    borderRadius: 4,
    marginLeft: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 40,
  },
});
