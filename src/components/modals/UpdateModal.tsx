import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { TVFocusable } from '../common/TVFocusable';
import { UpdateInfo, installAppUpdate, CURRENT_APP_VERSION } from '../../services/updater';

interface UpdateModalProps {
  visible: boolean;
  updateInfo: UpdateInfo | null;
  onDismiss: () => void;
}

export const UpdateModal = memo(function UpdateModalComponent({
  visible,
  updateInfo,
  onDismiss,
}: UpdateModalProps) {
  if (!updateInfo) return null;

  const handleUpdatePress = () => {
    if (updateInfo.apkUrl) {
      installAppUpdate(updateInfo.apkUrl);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!updateInfo.isMandatory) {
          onDismiss();
        }
      }}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header Badge */}
          <View style={styles.badgeRow}>
            <View style={styles.versionBadge}>
              <Text style={styles.versionBadgeText}>NEW UPDATE</Text>
            </View>
            {updateInfo.releaseDate && (
              <Text style={styles.releaseDateText}>{updateInfo.releaseDate}</Text>
            )}
          </View>

          {/* Title & Version comparison */}
          <Text style={styles.title}>Update Available</Text>
          <Text style={styles.versionComparison}>
            Version <Text style={styles.highlightVersion}>v{updateInfo.versionName}</Text> is ready to install (Current: v{CURRENT_APP_VERSION.versionName}).
          </Text>

          {/* Changelog Box */}
          <View style={styles.changelogBox}>
            <Text style={styles.changelogTitle}>What's New:</Text>
            <ScrollView style={styles.changelogScroll} showsVerticalScrollIndicator={false}>
              {updateInfo.changelog.map((change, index) => (
                <View key={index} style={styles.changeItemRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.changeText}>{change}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            {!updateInfo.isMandatory && (
              <TVFocusable
                onPress={onDismiss}
                scaleOnFocus
                style={[styles.btn, styles.btnSecondary, styles.actionButtonContainer]}>
                <Text style={styles.btnSecondaryText}>Later</Text>
              </TVFocusable>
            )}

            <TVFocusable
              onPress={handleUpdatePress}
              hasTVPreferredFocus
              scaleOnFocus
              style={[styles.btn, styles.btnPrimary, styles.actionButtonContainer]}>
              <Text style={styles.btnPrimaryText}>Update Now</Text>
            </TVFocusable>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#0F1016',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  versionBadge: {
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.4)',
  },
  versionBadgeText: {
    color: '#E50914',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  releaseDateText: {
    color: '#8A8D98',
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  versionComparison: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
    marginBottom: 16,
  },
  highlightVersion: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  changelogBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    maxHeight: 180,
    marginBottom: 20,
  },
  changelogTitle: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  changelogScroll: {
    maxHeight: 130,
  },
  changeItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bullet: {
    color: '#E50914',
    fontSize: 14,
    marginRight: 8,
    lineHeight: 18,
  },
  changeText: {
    flex: 1,
    color: '#E5E7EB',
    fontSize: 13,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButtonContainer: {
    flex: 1,
  },
  btn: {
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  btnSecondaryText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '600',
  },
  btnPrimary: {
    backgroundColor: '#E50914',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
