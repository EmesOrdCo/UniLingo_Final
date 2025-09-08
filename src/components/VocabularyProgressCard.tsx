import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VocabularyProgressCardProps {
  onPress?: () => void;
}

export default function VocabularyProgressCard({ onPress }: VocabularyProgressCardProps) {
  // Mock data - in a real app, this would come from your data service
  const vocabularyData = {
    period: "Last 14 days",
    newItems: 4,
    chartData: [
      { date: "1 Sep", items: 4 },
      { date: "2 Sep", items: 0 },
      { date: "3 Sep", items: 0 },
      { date: "4 Sep", items: 0 },
      { date: "5 Sep", items: 0 },
      { date: "6 Sep", items: 0 },
      { date: "7 Sep", items: 0 },
      { date: "8 Sep", items: 0 },
      { date: "9 Sep", items: 0 },
      { date: "10 Sep", items: 0 },
      { date: "11 Sep", items: 0 },
      { date: "12 Sep", items: 0 },
      { date: "13 Sep", items: 0 },
      { date: "14 Sep", items: 0 },
    ]
  };

  const maxItems = Math.max(...vocabularyData.chartData.map(d => d.items));

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.periodText}>{vocabularyData.period}</Text>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.newItemsText}>{vocabularyData.newItems} new items</Text>
        
        <View style={styles.chartContainer}>
          {/* Y-axis labels */}
          <View style={styles.yAxisContainer}>
            <Text style={styles.yAxisLabel}>4</Text>
            <Text style={styles.yAxisLabel}>3</Text>
            <Text style={styles.yAxisLabel}>2</Text>
            <Text style={styles.yAxisLabel}>1</Text>
            <Text style={styles.yAxisLabel}>0</Text>
          </View>
          
          {/* Chart area */}
          <View style={styles.chartArea}>
            {/* Grid lines */}
            <View style={styles.gridLines}>
              {[0, 1, 2, 3, 4].map((line) => (
                <View key={line} style={[styles.gridLine, { bottom: `${line * 20}%` }]} />
              ))}
            </View>
            
            {/* Bars */}
            <View style={styles.chart}>
              {vocabularyData.chartData.map((data, index) => {
                const height = maxItems > 0 ? (data.items / maxItems) * 100 : 0;
                return (
                  <View key={index} style={styles.barContainer}>
                    <View 
                      style={[
                        styles.bar, 
                        { 
                          height: `${Math.max(height, 0)}%`,
                          backgroundColor: data.items > 0 ? '#8b5cf6' : 'transparent'
                        }
                      ]} 
                    />
                  </View>
                );
              })}
            </View>
          </View>
        </View>
        
        {/* X-axis labels */}
        <View style={styles.xAxisLabels}>
          <Text style={styles.xAxisLabel}>1 Sep</Text>
          <Text style={styles.xAxisLabel}>8 S...</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  periodText: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '400',
  },
  content: {
    gap: 12,
  },
  newItemsText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  chartContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  yAxisContainer: {
    justifyContent: 'space-between',
    height: 100,
    paddingVertical: 4,
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '400',
    textAlign: 'right',
    width: 16,
  },
  chartArea: {
    flex: 1,
    position: 'relative',
    height: 100,
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '100%',
    gap: 1,
    paddingHorizontal: 2,
  },
  barContainer: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderRadius: 2,
    minHeight: 1,
    maxHeight: '100%',
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 8,
  },
  xAxisLabel: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '400',
  },
});
