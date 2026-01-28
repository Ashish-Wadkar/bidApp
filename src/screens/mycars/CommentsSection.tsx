import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';

interface CommentsSectionProps {
  beadingCarId: string;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ beadingCarId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comments, setComments] = useState<string[]>([]);

  const fetchCommentsData = async () => {
    setLoading(true);
    setError('');
    try {
      const docType = 'Comments';
      const response = await fetch(
        `http://10.98.89.200:8086/uploadFileBidCar/getBidCarIdType?beadingCarId=${beadingCarId}&docType=${docType}`,
      );
      const text = await response.text();
      const data = JSON.parse(text);
      if (data?.object && Array.isArray(data.object)) {
        const list: string[] = [];
        data.object.forEach((item: any) => {
          if (item.subtype === 'Comment' && item.comment) list.push(item.comment);
        });
        setComments(list);
      }
    } catch {
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (beadingCarId) fetchCommentsData();
  }, [beadingCarId]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#262a4f" />
        <Text style={styles.loadingText}>Loading comments...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.mainTitle}>Comments</Text>

        <View style={styles.card}>
          <View style={styles.gridContainer}>
            {comments.length === 0 ? (
              <Text style={styles.emptyText}>No comments available</Text>
            ) : (
              comments.map((c, i) => (
                <View key={i} style={styles.itemContainer}>
                  <Text style={styles.itemText}>Comment {i + 1}: {c || '-'}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#374151',
  },
  errorText: {
    fontSize: 14,
    color: 'red',
    textAlign: 'center',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 550,
  },
  gridContainer: {
    gap: 20,
  },
  itemContainer: {
    marginBottom: 16,
  },
  itemText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});

export default CommentsSection;
