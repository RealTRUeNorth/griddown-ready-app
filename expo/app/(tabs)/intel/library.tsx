import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { router, Href } from 'expo-router';
import {
  Search,
  Download,
  BookMarked,
  ChevronRight,
  Import,
  Share2,
  Heart,
  Stethoscope,
  Compass,
  Home,
  Radio,
  Wrench,
  Wheat,
  ShieldAlert,
  Library,
  HardDrive,
  Trash2,
  X,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import Colors from '@/constants/colors';
import { useAppData } from '@/providers/AppProvider';
import { kiwixCatalog, kiwixCategories } from '@/mocks/kiwix';
import { KiwixResource } from '@/types';

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

export default function LibraryScreen() {
  const {
    kiwixLibrary,
    saveKiwixResource,
    removeKiwixResource,
    importKiwixLibrary,
    exportKiwixLibrary,
  } = useAppData();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'catalog' | 'saved'>('catalog');
  const [showImportField, setShowImportField] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>('');

  const savedIds = useMemo(() => new Set(kiwixLibrary.map((r) => r.id)), [kiwixLibrary]);

  const displayItems = useMemo(() => {
    const source = viewMode === 'catalog' ? kiwixCatalog : kiwixLibrary;
    let items = source;

    if (selectedCategory !== 'all') {
      items = items.filter((r) => r.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return items;
  }, [viewMode, selectedCategory, searchQuery, kiwixLibrary]);

  const handleSave = useCallback(
    (resource: KiwixResource) => {
      saveKiwixResource(resource);
      console.log('Saved resource to library:', resource.id);
    },
    [saveKiwixResource]
  );

  const handleRemove = useCallback(
    (id: string) => {
      Alert.alert(
        'Remove from Library',
        'Remove this resource from your saved library?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              removeKiwixResource(id);
              console.log('Removed resource:', id);
            },
          },
        ]
      );
    },
    [removeKiwixResource]
  );

  const handleExport = useCallback(async () => {
    const data = exportKiwixLibrary();
    if (kiwixLibrary.length === 0) {
      Alert.alert('Empty Library', 'Save some resources first before exporting.');
      return;
    }
    try {
      await Clipboard.setStringAsync(data);
      Alert.alert(
        'Exported',
        `${kiwixLibrary.length} resource(s) copied to clipboard. Share this JSON with your group members so they can import the same library.`
      );
      console.log('Exported library to clipboard');
    } catch (e) {
      console.log('Export error:', e);
      Alert.alert('Error', 'Could not copy to clipboard.');
    }
  }, [exportKiwixLibrary, kiwixLibrary]);

  const handleImport = useCallback(() => {
    if (!importText.trim()) {
      Alert.alert('Empty', 'Paste the JSON library data first.');
      return;
    }
    try {
      const parsed = JSON.parse(importText) as KiwixResource[];
      if (!Array.isArray(parsed)) {
        Alert.alert('Invalid', 'The data is not a valid library export.');
        return;
      }
      importKiwixLibrary(parsed);
      setImportText('');
      setShowImportField(false);
      Alert.alert('Imported', `Successfully merged ${parsed.length} resource(s) into your library.`);
      console.log('Imported library, count:', parsed.length);
    } catch (e) {
      console.log('Import parse error:', e);
      Alert.alert('Parse Error', 'Could not parse the data. Make sure it is valid JSON.');
    }
  }, [importText, importKiwixLibrary]);

  const renderResourceCard = useCallback(
    (resource: KiwixResource) => {
      const isSaved = savedIds.has(resource.id);
      const catColor = categoryColorMap[resource.category] ?? Colors.textMuted;
      const renderIcon = categoryIconMap[resource.category];

      return (
        <TouchableOpacity
          key={resource.id}
          style={styles.resourceCard}
          onPress={() =>
            router.push({
              pathname: '/resource-detail',
              params: { id: resource.id },
            } as unknown as Href)
          }
          activeOpacity={0.7}
          testID={`resource-card-${resource.id}`}
        >
          <View style={[styles.resourceIconWrap, { backgroundColor: catColor + '25' }]}>
            {renderIcon ? renderIcon(catColor, 22) : <BookMarked color={catColor} size={22} />}
          </View>

          <View style={styles.resourceInfo}>
            <View style={styles.resourceMeta}>
              <Text style={[styles.resourceCategory, { color: catColor }]}>
                {resource.category.toUpperCase()}
              </Text>
              <View style={styles.sizeChip}>
                <HardDrive color={Colors.textMuted} size={10} />
                <Text style={styles.sizeText}>{resource.sizeLabel}</Text>
              </View>
            </View>
            <Text style={styles.resourceTitle} numberOfLines={1}>{resource.title}</Text>
            <Text style={styles.resourceDesc} numberOfLines={2}>{resource.description}</Text>
            <View style={styles.tagRow}>
              {resource.tags.slice(0, 3).map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.cardActions}>
            {viewMode === 'catalog' ? (
              isSaved ? (
                <View style={styles.savedBadge}>
                  <Heart color={Colors.green} size={14} fill={Colors.green} />
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={() => handleSave(resource)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Download color={Colors.orange} size={18} />
                </TouchableOpacity>
              )
            ) : (
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemove(resource.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Trash2 color={Colors.red} size={16} />
              </TouchableOpacity>
            )}
            <ChevronRight color={Colors.textMuted} size={16} />
          </View>
        </TouchableOpacity>
      );
    },
    [savedIds, viewMode, handleSave, handleRemove]
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, viewMode === 'catalog' && styles.modeBtnActive]}
            onPress={() => setViewMode('catalog')}
            testID="mode-catalog"
          >
            <Library color={viewMode === 'catalog' ? Colors.white : Colors.textMuted} size={16} />
            <Text style={[styles.modeBtnText, viewMode === 'catalog' && styles.modeBtnTextActive]}>
              Catalog
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, viewMode === 'saved' && styles.modeBtnActive]}
            onPress={() => setViewMode('saved')}
            testID="mode-saved"
          >
            <Heart color={viewMode === 'saved' ? Colors.white : Colors.textMuted} size={16} />
            <Text style={[styles.modeBtnText, viewMode === 'saved' && styles.modeBtnTextActive]}>
              My Library ({kiwixLibrary.length})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Search color={Colors.textMuted} size={16} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search resources..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              testID="search-input"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X color={Colors.textMuted} size={16} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {kiwixCategories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.filterChip,
                selectedCategory === cat.key && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === cat.key && styles.filterChipTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {viewMode === 'saved' && (
          <View style={styles.importExportRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleExport} testID="export-btn">
              <Share2 color={Colors.orange} size={16} />
              <Text style={styles.actionBtnText}>Export</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setShowImportField(!showImportField)}
              testID="import-btn"
            >
              <Import color={Colors.orange} size={16} />
              <Text style={styles.actionBtnText}>Import</Text>
            </TouchableOpacity>
          </View>
        )}

        {showImportField && viewMode === 'saved' && (
          <View style={styles.importSection}>
            <Text style={styles.importLabel}>Paste library JSON from a group member:</Text>
            <TextInput
              style={styles.importInput}
              placeholder='[{"id":"...","title":"..."}]'
              placeholderTextColor={Colors.textMuted}
              value={importText}
              onChangeText={setImportText}
              multiline
              numberOfLines={4}
              testID="import-input"
            />
            <View style={styles.importActions}>
              <TouchableOpacity
                style={styles.importCancelBtn}
                onPress={() => {
                  setShowImportField(false);
                  setImportText('');
                }}
              >
                <Text style={styles.importCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.importConfirmBtn} onPress={handleImport}>
                <Text style={styles.importConfirmText}>Import</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {displayItems.length === 0 ? (
          <View style={styles.emptyState}>
            <BookMarked color={Colors.textMuted} size={48} />
            <Text style={styles.emptyTitle}>
              {viewMode === 'saved' ? 'No saved resources' : 'No results found'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {viewMode === 'saved'
                ? 'Browse the catalog and save resources to build your offline library'
                : 'Try adjusting your search or category filters'}
            </Text>
          </View>
        ) : (
          <View style={styles.resourceList}>
            <Text style={styles.resultCount}>
              {displayItems.length} resource{displayItems.length !== 1 ? 's' : ''}
            </Text>
            {displayItems.map(renderResourceCard)}
          </View>
        )}
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
    paddingBottom: 40,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  modeBtnActive: {
    backgroundColor: Colors.olive,
  },
  modeBtnText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  modeBtnTextActive: {
    color: Colors.white,
  },
  searchRow: {
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    padding: 0,
  },
  filterScroll: {
    marginBottom: 14,
  },
  filterContent: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.olive,
    borderColor: Colors.olive,
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  importExportRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: Colors.orangeMuted,
  },
  actionBtnText: {
    color: Colors.orange,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  importSection: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  importLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 8,
  },
  importInput: {
    backgroundColor: Colors.bg,
    borderRadius: 8,
    padding: 10,
    color: Colors.textPrimary,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  importActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  importCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.bgElevated,
  },
  importCancelText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  importConfirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.olive,
  },
  importConfirmText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  resourceList: {},
  resultCount: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    marginBottom: 10,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resourceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  resourceCategory: {
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
  },
  sizeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  sizeText: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  resourceTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  resourceDesc: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  tag: {
    backgroundColor: Colors.bgElevated,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: '600' as const,
  },
  cardActions: {
    alignItems: 'center',
    gap: 8,
    marginLeft: 6,
  },
  saveBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.orangeMuted + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.green + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.redMuted + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700' as const,
    marginTop: 16,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
