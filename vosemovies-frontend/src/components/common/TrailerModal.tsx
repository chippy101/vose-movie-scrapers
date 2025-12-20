import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Linking,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';

const { width, height } = Dimensions.get('window');

// Calculate video dimensions with 16:9 aspect ratio
const VIDEO_WIDTH = width - 32; // 16px margin on each side
const VIDEO_HEIGHT = (VIDEO_WIDTH * 9) / 16; // 16:9 aspect ratio

interface TrailerModalProps {
  visible: boolean;
  trailerKey?: string;
  movieTitle?: string;
  movieYear?: number;
  onClose: () => void;
}

export default function TrailerModal({
  visible,
  trailerKey,
  movieTitle,
  movieYear,
  onClose,
}: TrailerModalProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(false);

  const handleClose = () => {
    setIsReady(false);
    setError(false);
    onClose();
  };

  const handleOpenYouTube = () => {
    if (trailerKey) {
      Linking.openURL(`https://www.youtube.com/watch?v=${trailerKey}`);
    } else if (movieTitle) {
      const searchQuery = encodeURIComponent(
        `${movieTitle} ${movieYear || ''} official trailer`
      );
      Linking.openURL(`https://www.youtube.com/results?search_query=${searchQuery}`);
    }
    handleClose();
  };

  const handleError = () => {
    setError(true);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={30} color="#ffffff" />
          </TouchableOpacity>

          {/* Player Container */}
          <View style={styles.playerContainer}>
            {trailerKey && !error ? (
              <>
                {!isReady && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#e50914" />
                    <Text style={styles.loadingText}>Loading trailer...</Text>
                  </View>
                )}
                <YoutubePlayer
                  height={VIDEO_HEIGHT}
                  width={VIDEO_WIDTH}
                  videoId={trailerKey}
                  play={true}
                  onReady={() => setIsReady(true)}
                  onError={handleError}
                  webViewStyle={{ opacity: isReady ? 1 : 0 }}
                />
              </>
            ) : (
              <View style={styles.errorContainer}>
                <Ionicons name="film-outline" size={60} color="#666666" />
                <Text style={styles.errorText}>
                  {error
                    ? 'Unable to load trailer'
                    : 'No trailer available for this movie'}
                </Text>
                <TouchableOpacity
                  style={styles.youtubeButton}
                  onPress={handleOpenYouTube}
                >
                  <Ionicons name="logo-youtube" size={24} color="#ffffff" />
                  <Text style={styles.youtubeButtonText}>Search on YouTube</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Open in YouTube Button */}
          {trailerKey && !error && (
            <TouchableOpacity
              style={styles.openYoutubeButton}
              onPress={handleOpenYouTube}
            >
              <Ionicons name="logo-youtube" size={18} color="#ffffff" />
              <Text style={styles.openYoutubeText}>Open in YouTube</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: '#141414',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerContainer: {
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000000',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 10,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#cccccc',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  youtubeButton: {
    flexDirection: 'row',
    backgroundColor: '#e50914',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  youtubeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  openYoutubeButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f1f1f',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  openYoutubeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
});
