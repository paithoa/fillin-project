import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PostCard = ({ post, onPress }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {post.image ? (
        <Image
          source={{ uri: post.image }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image-outline" size={60} color="#ccc" />
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {post.title}
        </Text>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color="#555" />
          <Text style={styles.infoText} numberOfLines={1}>
            {post.location}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="people-outline" size={14} color="#555" />
          <Text style={styles.infoText}>
            {post.lookingToJoin
              ? 'Looking to join a team'
              : `Looking for ${post.playersNeeded || 0} player${
                  post.playersNeeded !== 1 ? 's' : ''
                }`}
          </Text>
        </View>
        {post.grade && (
          <View style={styles.infoRow}>
            <Ionicons name="star-outline" size={14} color="#555" />
            <Text style={styles.infoText}>Grade: {post.grade}</Text>
          </View>
        )}
        <View style={styles.footer}>
          <Text style={styles.date}>{formatDate(post.createdAt)}</Text>
          <Text style={styles.userName}>{post.user?.name || 'Anonymous'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 8,
    marginHorizontal: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    height: 150,
  },
  image: {
    width: 120,
    height: '100%',
  },
  imagePlaceholder: {
    width: 120,
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#555',
    marginLeft: 4,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  date: {
    fontSize: 10,
    color: '#777',
  },
  userName: {
    fontSize: 10,
    color: '#0066CC',
    fontWeight: '600',
  },
});

export default PostCard; 