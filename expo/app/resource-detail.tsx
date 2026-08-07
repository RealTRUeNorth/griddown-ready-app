import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import {
  ExternalLink,
  Download,
  Heart,
  Trash2,
  HardDrive,
  Globe,
  Calendar,
  Tag,
  Stethoscope,
  Compass,
  Home,
  Radio,
  Wrench,
  Wheat,
  ShieldAlert,
  Library,
  BookMarked,
  Share2,
  Copy,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import Colors from '@/constants/colors';
import { useAppData } from '@/providers/AppProvider';
import { kiwixCatalog } from '@/mocks/kiwix';

const categoryIconMap: Record<string, (color: string, size: number) => React.ReactNode> = {
  medical: (c, s) => <Stethoscope color={c} size={s} />,
  survival: (c, s) => <Compass color={c} size={s} />,
  homesteading: (c, s) => <Home color={c} size={s} />,
  comms: (c, s) => <Radio color={c} size={s} />,
  engineering: (c, s) => <Wrench color={c} size={s} />,
  agriculture: (c, s) => <Wheat color={c} size={s} />,
  security: (c, s) => <ShieldAlert color={c} size={s} />,
  reference: (c, s) => <Library color={c} size={s} />,
  other: (c, s) => <BookMarked color={c} size={s} />,
};

const categoryColorMap: Record<string, string> = {
  medical: '#CC3333',
  survival: '#4A8B4A',
  homesteading: '#D4822A',
  comms: '#5588CC',
  engineering: '#9A7B4A',
  agriculture: '#6B8B4A',
  security: '#8B4A6B',
  reference: '#6A6AAB',
  other: '#6A6860',
};

export default function ResourceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { kiwixLibrary, saveKiwixResource, removeKiwixResource } = useAppData();

  const resource = useMemo(() => {
    const saved = kiwixLibrary.find((r) => r.id === id);
    if (saved) return saved;
    return kiwixCatalog.find((r) => r.id === id);
  }, [id, kiwixLibrary]);

  const isSaved = useMemo(() => {
    return kiwixLibrary.some((r) => r.id === id);
  }, [id, kiwixLibrary]);

  const handleOpenKiwix = useCallback(async () => {
    if (!resource) return;
    try {
      const supported = await Linking.canOpenURL(resource.downloadUrl);
      if (supported) {
        await Linking.openURL(resource.downloadUrl);
      } else {
        await Linking.openURL(resource.downloadUrl);
      }
      console.log('Opened Kiwix URL:', resource.downloadUrl);
    } catch (e) {
      console.log('Error opening URL:', e);
      Alert.alert('Error', 'Could not open the download link.');
    }
  }, [resource]);

  const handleCopyLink = useCallback(async () => {
    if (!resource) return;
    try {
      await Clipboard.setStringAsync(resource.downloadUrl);
      Alert.alert('Copied', 'Download link copied to clipboard.');
    } catch (e) {
      console.log('Copy error:', e);
    }
  }, [resource]);

  const handleToggleSave = useCallback(() => {
    if (!resource) return;
    if (isSaved) {
      Alert.alert('Remove from Library', 'Remove this resource from your saved library?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeKiwixResource(resource.id),
        },
      ]);
    } else {
      saveKiwixResource(resource);
      Alert.alert('Saved', 'Resource added to your library.');
    }
  }, [resource, isSaved, saveKiwixResource, removeKiwixResource]);

  const handleShareResource = useCallback(async () => {
    if (!resource) return;
    const shareData = JSON.stringify([resource], null, 2);
    try {
      await Clipboard.setStringAsync(shareData);
      Alert.alert(
        'Share Ready',
        'Resource JSON copied to clipboard. Send it to a group member so they can import it into their library.'
      );
    } catch (e) {
      console.log('Share error:', e);
    }
  }, [resource]);

  if (!resource) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Resource' }} />
        <View style={styles.errorState}>
          <BookMarked color={Colors.textMuted} size={48} />
          <Text style={styles.errorText}>Resource not found</Text>
        </View>
      </View>
    );
  }

  const catColor = categoryColorMap[resource.category] ?? Colors.textMuted;
  const renderIcon = categoryIconMap[resource.category];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: resource.title }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroSection, { borderColor: catColor + '40' }]}>
          <View style={[styles.heroIcon, { backgroundColor: catColor + '20' }]}>
            {renderIcon ? renderIcon(catColor, 40) : <BookMarked color={catColor} size={40} />}
          </View>
          <View style={styles.categoryBadge}>
            <Text style={[styles.categoryText, { color: catColor }]}>
              {resource.category.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.heroTitle}>{resource.title}</Text>
          <Text style={styles.heroDesc}>{resource.description}</Text>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <HardDrive color={Colors.orange} size={18} />
            <Text style={styles.metaLabel}>Size</Text>
            <Text style={styles.metaValue}>{resource.sizeLabel}</Text>
          </View>
          <View style={styles.metaItem}>
            <Globe color={Colors.orange} size={18} />
            <Text style={styles.metaLabel}>Language</Text>
            <Text style={styles.metaValue}>{resource.language}</Text>
          </View>
          <View style={styles.metaItem}>
            <Calendar color={Colors.orange} size={18} />
            <Text style={styles.metaLabel}>Updated</Text>
            <Text style={styles.metaValue}>{resource.lastUpdated}</Text>
          </View>
        </View>

        <View style={styles.tagsSection}>
          <View style={styles.sectionHeader}>
            <Tag color={Colors.textSecondary} size={14} />
            <Text style={styles.sectionTitle}>Tags</Text>
          </View>
          <View style={styles.tagsWrap}>
            {resource.tags.map((tag) => (
              <View key={tag} style={[styles.tagChip, { borderColor: catColor + '40' }]}>
                <Text style={styles.tagChipText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {isSaved && resource.savedAt && (
          <View style={styles.savedInfo}>
            <Heart color={Colors.green} size={14} fill={Colors.green} />
            <Text style={styles.savedInfoText}>
              Saved on {new Date(resource.savedAt).toLocaleDateString()}
            </Text>
          </View>
        )}

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: catColor }]}
            onPress={handleOpenKiwix}
            testID="open-kiwix-btn"
          >
            <ExternalLink color={Colors.white} size={18} />
            <Text style={styles.primaryBtnText}>Open in Kiwix Library</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              isSaved ? styles.removeBtnStyle : styles.saveBtnStyle,
            ]}
            onPress={handleToggleSave}
            testID="toggle-save-btn"
          >
            {isSaved ? (
              <>
                <Trash2 color={Colors.red} size={18} />
                <Text style={[styles.secondaryBtnText, { color: Colors.red }]}>
                  Remove from Library
                </Text>
              </>
            ) : (
              <>
                <Download color={Colors.orange} size={18} />
                <Text style={[styles.secondaryBtnText, { color: Colors.orange }]}>
                  Save to Library
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.utilRow}>
            <TouchableOpacity style={styles.utilBtn} onPress={handleCopyLink}>
              <Copy color={Colors.textSecondary} size={16} />
              <Text style={styles.utilBtnText}>Copy Link</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.utilBtn} onPress={handleShareResource}>
              <Share2 color={Colors.textSecondary} size={16} />
              <Text style={styles.utilBtnText}>Share JSON</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>How to use Kiwix files</Text>
          <Text style={styles.infoBoxText}>
            1. Tap "Open in Kiwix Library" to browse the file on kiwix.org{'\n'}
            2. Download the .zim file to your device using Kiwix app{'\n'}
            3. Install the Kiwix reader app on your phone or computer{'\n'}
            4. Open the .zim file in Kiwix for full offline access{'\n'}
            5. Share your library list with group members via Export/Import
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 50,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: Colors.textMuted,
    fontSize: 16,
    marginTop: 12,
  },
  heroSection: {
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  categoryBadge: {
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 2,
  },
  heroTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800' as const,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metaItem: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metaLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  metaValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700' as const,
  },
  tagsSection: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    backgroundColor: Colors.bgElevated,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  tagChipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500' as const,
  },
  savedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.green + '15',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  savedInfoText: {
    color: Colors.greenLight,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  actionsSection: {
    gap: 10,
    marginBottom: 20,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
  },
  saveBtnStyle: {
    borderColor: Colors.orangeMuted,
    backgroundColor: Colors.orangeMuted + '20',
  },
  removeBtnStyle: {
    borderColor: Colors.redMuted,
    backgroundColor: Colors.redMuted + '20',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  utilRow: {
    flexDirection: 'row',
    gap: 10,
  },
  utilBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  utilBtnText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  infoBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.olive + '30',
    borderLeftWidth: 3,
    borderLeftColor: Colors.olive,
  },
  infoBoxTitle: {
    color: Colors.oliveLight,
    fontSize: 13,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  infoBoxText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 20,
  },
});
