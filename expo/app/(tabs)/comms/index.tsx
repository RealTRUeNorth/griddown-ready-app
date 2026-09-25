import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Pressable,
} from 'react-native';
import { router, Href } from 'expo-router';
import {
  Radio,
  Antenna,
  Wifi,
  Zap,
  ChevronRight,
  Plus,
  Shield,
  Eye,
  Signal,
  AlertTriangle,
  BookOpen,
  Repeat,
  Target,
  Volume2,
  Hash,
  Trash2,
  MessageSquareText,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppData } from '@/providers/AppProvider';
import { openSms } from '@/utils/sms';
import { CommsChannel, CommsRepeater } from '@/types';
import {
  BAND_INFO,
  defaultCommsProtocols,
} from '@/mocks/comms';

type TabId = 'channels' | 'repeaters' | 'protocols' | 'reference';

export default function CommsScreen() {
  const {
    commsChannels,
    commsRepeaters,
    removeCommsChannel,
    removeCommsRepeater,
    alertLevel,
    groupName,
    members,
  } = useAppData();

  const [activeTab, setActiveTab] = useState<TabId>('channels');
  const [expandedProtocol, setExpandedProtocol] = useState<string | null>(null);

  const handleTabChange = useCallback((tab: TabId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  }, []);

  const handleDeleteChannel = useCallback((channel: CommsChannel) => {
    Alert.alert(
      'Remove Channel',
      `Remove "${channel.name}" from your comms plan?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeCommsChannel(channel.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  }, [removeCommsChannel]);

  const handleDeleteRepeater = useCallback((repeater: CommsRepeater) => {
    Alert.alert(
      'Remove Repeater',
      `Remove "${repeater.name}" from your comms plan?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeCommsRepeater(repeater.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  }, [removeCommsRepeater]);

  const toggleProtocol = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedProtocol((prev) => (prev === id ? null : id));
  }, []);

  // Opens the messaging app with every member's number pre-filled and a
  // status snapshot in the body — the SMS fallback when radios are down.
  const handleBroadcast = useCallback(async () => {
    const numbers = members
      .map((m) => m.phone)
      .filter((p): p is string => !!p && p.trim().length > 0);
    if (numbers.length === 0) {
      Alert.alert('No Phone Numbers', 'Add phone numbers to group members first.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const primary = commsChannels.find((c) => c.isPrimary);
    const body =
      `[GRIDDOWN] ${groupName} — alert level ${alertLevel.toUpperCase()}.` +
      (primary ? ` Primary channel: ${primary.frequency} (${primary.band}).` : '') +
      ' Acknowledge when received.';
    const ok = await openSms(numbers, body);
    if (!ok) {
      Alert.alert('Messaging Unavailable', 'Could not open the messaging app on this device.');
    }
  }, [members, commsChannels, groupName, alertLevel]);

  const alertBorderColor =
    alertLevel === 'red'
      ? Colors.statusRed
      : alertLevel === 'amber'
      ? Colors.statusAmber
      : Colors.olive;

  const primaryChannel = commsChannels.find((c) => c.isPrimary);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.statusBanner, { borderColor: alertBorderColor }]}>
        <View style={styles.statusRow}>
          <Radio color={alertBorderColor} size={18} />
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>COMMS STATUS</Text>
            <Text style={styles.statusValue}>
              {commsChannels.length} Channels • {commsRepeaters.length} Repeaters
            </Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: alertBorderColor }]} />
        </View>
        {primaryChannel && (
          <View style={styles.primaryRow}>
            <Zap color={Colors.statusGreen} size={12} />
            <Text style={styles.primaryText}>
              PRIMARY: {primaryChannel.frequency} ({primaryChannel.band})
            </Text>
          </View>
        )}
      </View>

      <View style={styles.tabBar}>
        {([
          { id: 'channels' as TabId, label: 'CHANNELS', icon: Hash },
          { id: 'repeaters' as TabId, label: 'REPEATERS', icon: Repeat },
          { id: 'protocols' as TabId, label: 'PROTOCOLS', icon: BookOpen },
          { id: 'reference' as TabId, label: 'REFERENCE', icon: Signal },
        ]).map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]}
            onPress={() => handleTabChange(tab.id)}
          >
            <tab.icon
              color={activeTab === tab.id ? Colors.orange : Colors.textMuted}
              size={14}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.id && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'channels' && (
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CHANNEL ASSIGNMENTS</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.addButton, styles.broadcastButton]}
                onPress={() => void handleBroadcast()}
                activeOpacity={0.7}
              >
                <MessageSquareText color={Colors.white} size={13} />
                <Text style={styles.addButtonText}>SMS GROUP</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/add-channel' as Href);
                }}
              >
                <Plus color={Colors.white} size={14} />
                <Text style={styles.addButtonText}>ADD</Text>
              </TouchableOpacity>
            </View>
          </View>

          {commsChannels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onDelete={() => handleDeleteChannel(channel)}
              onEdit={() =>
                router.push({ pathname: '/add-channel', params: { id: channel.id } } as unknown as Href)
              }
            />
          ))}

          {commsChannels.length === 0 && (
            <View style={styles.emptyState}>
              <Hash color={Colors.textMuted} size={32} />
              <Text style={styles.emptyText}>No channels configured</Text>
              <Text style={styles.emptySubtext}>
                Add your group's frequency assignments
              </Text>
            </View>
          )}
        </View>
      )}

      {activeTab === 'repeaters' && (
        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>REPEATER DIRECTORY</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/add-repeater' as Href);
              }}
            >
              <Plus color={Colors.white} size={14} />
              <Text style={styles.addButtonText}>ADD</Text>
            </TouchableOpacity>
          </View>

          {commsRepeaters.map((repeater) => (
            <RepeaterCard
              key={repeater.id}
              repeater={repeater}
              onDelete={() => handleDeleteRepeater(repeater)}
              onEdit={() =>
                router.push({ pathname: '/add-repeater', params: { id: repeater.id } } as unknown as Href)
              }
            />
          ))}

          {commsRepeaters.length === 0 && (
            <View style={styles.emptyState}>
              <Repeat color={Colors.textMuted} size={32} />
              <Text style={styles.emptyText}>No repeaters logged</Text>
              <Text style={styles.emptySubtext}>
                Add known repeaters in your area
              </Text>
            </View>
          )}
        </View>
      )}

      {activeTab === 'protocols' && (
        <View>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>
            STANDARD OPERATING PROCEDURES
          </Text>

          {defaultCommsProtocols.map((proto) => (
            <TouchableOpacity
              key={proto.id}
              style={styles.protoCard}
              onPress={() => toggleProtocol(proto.id)}
              activeOpacity={0.7}
            >
              <View style={styles.protoHeader}>
                <View style={styles.protoIconWrap}>
                  {proto.id === 'proto1' && <Volume2 color={Colors.olive} size={16} />}
                  {proto.id === 'proto2' && <AlertTriangle color={Colors.statusRed} size={16} />}
                  {proto.id === 'proto3' && <Signal color={Colors.oliveLight} size={16} />}
                  {proto.id === 'proto4' && <Wifi color={Colors.orangeLight} size={16} />}
                  {proto.id === 'proto5' && <Eye color={Colors.amberLight} size={16} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.protoTitle}>{proto.title}</Text>
                  <Text style={styles.protoDesc}>{proto.description}</Text>
                </View>
                <ChevronRight
                  color={Colors.textMuted}
                  size={16}
                  style={{
                    transform: [
                      { rotate: expandedProtocol === proto.id ? '90deg' : '0deg' },
                    ],
                  }}
                />
              </View>
              {expandedProtocol === proto.id && (
                <View style={styles.protoSteps}>
                  {proto.steps.map((step, i) => (
                    <View key={i} style={styles.stepRow}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{i + 1}</Text>
                      </View>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {activeTab === 'reference' && (
        <View>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>
            RADIO BAND REFERENCE
          </Text>

          {Object.entries(BAND_INFO).map(([key, info]) => (
            <View key={key} style={styles.bandCard}>
              <View style={styles.bandHeader}>
                <View style={[styles.bandDot, { backgroundColor: info.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.bandName}>{key.replace('_', ' ')}</Text>
                  <Text style={styles.bandLabel}>{info.label}</Text>
                </View>
                <View style={styles.bandBadge}>
                  <Text style={styles.bandRange}>{info.range}</Text>
                </View>
              </View>
              <View style={styles.bandFooter}>
                <Shield color={Colors.textMuted} size={10} />
                <Text style={styles.bandLicense}>{info.license}</Text>
              </View>
            </View>
          ))}

          <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 12 }]}>
            LINE-OF-SIGHT QUICK REFERENCE
          </Text>

          <View style={styles.losCard}>
            <View style={styles.losRow}>
              <Target color={Colors.orangeLight} size={16} />
              <Text style={styles.losTitle}>LOS Distance Formula</Text>
            </View>
            <Text style={styles.losFormula}>
              D(miles) ≈ 1.23 × (√h₁ + √h₂)
            </Text>
            <Text style={styles.losNote}>
              h₁, h₂ = antenna heights in feet above terrain
            </Text>

            <View style={styles.losTable}>
              <View style={styles.losTableHeader}>
                <Text style={styles.losColHeader}>Height</Text>
                <Text style={styles.losColHeader}>Range</Text>
                <Text style={styles.losColHeader}>Use Case</Text>
              </View>
              {[
                { h: '6 ft', r: '~3 mi', use: 'Handheld, standing' },
                { h: '20 ft', r: '~5.5 mi', use: 'Roof mount' },
                { h: '50 ft', r: '~8.7 mi', use: 'Tower / tree' },
                { h: '100 ft', r: '~12.3 mi', use: 'Hilltop relay' },
                { h: '500 ft', r: '~27.5 mi', use: 'Mountain relay' },
              ].map((row, i) => (
                <View key={i} style={styles.losTableRow}>
                  <Text style={styles.losCol}>{row.h}</Text>
                  <Text style={[styles.losCol, { color: Colors.orangeLight }]}>
                    {row.r}
                  </Text>
                  <Text style={styles.losCol}>{row.use}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 12 }]}>
            MESH NETWORKING
          </Text>

          <View style={styles.meshCard}>
            <View style={styles.meshRow}>
              <Wifi color={Colors.oliveLight} size={16} />
              <Text style={styles.meshTitle}>Mesh Relay Concepts</Text>
            </View>
            <View style={styles.meshContent}>
              <Text style={styles.meshPoint}>
                • Each node acts as both transmitter and relay
              </Text>
              <Text style={styles.meshPoint}>
                • Messages hop through intermediate nodes to reach destination
              </Text>
              <Text style={styles.meshPoint}>
                • No single point of failure — network self-heals around down nodes
              </Text>
              <Text style={styles.meshPoint}>
                • Effective range = N × single-hop range (N = number of hops)
              </Text>
              <Text style={styles.meshPoint}>
                • Latency increases with each hop — keep critical paths ≤ 3 hops
              </Text>
              <Text style={styles.meshPoint}>
                • Position relay nodes on high ground for best coverage
              </Text>
            </View>

            <View style={styles.meshDivider} />

            <View style={styles.meshRow}>
              <Antenna color={Colors.orangeLight} size={16} />
              <Text style={styles.meshTitle}>RF Propagation Tips</Text>
            </View>
            <View style={styles.meshContent}>
              <Text style={styles.meshPoint}>
                • VHF (136-174 MHz): Better foliage/terrain penetration
              </Text>
              <Text style={styles.meshPoint}>
                • UHF (400-520 MHz): Better indoor/urban penetration
              </Text>
              <Text style={styles.meshPoint}>
                • Higher power ≠ always better — can cause interference
              </Text>
              <Text style={styles.meshPoint}>
                • Antenna height gains outperform power increases
              </Text>
              <Text style={styles.meshPoint}>
                • Wet conditions degrade UHF more than VHF
              </Text>
              <Text style={styles.meshPoint}>
                • Use directional antennas for point-to-point links
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>CIVTEC COMMUNICATIONS PLAN</Text>
        <Text style={styles.footerSub}>All data stored locally • Offline ready</Text>
      </View>
    </ScrollView>
  );
}

function ChannelCard({
  channel,
  onDelete,
  onEdit,
}: {
  channel: CommsChannel;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bandInfo = BAND_INFO[channel.band];
  const bandColor = bandInfo?.color ?? Colors.textMuted;

  return (
    <Pressable
      onPress={onEdit}
      onPressIn={() => {
        Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
      }}
      onPressOut={() => {
        Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
      }}
    >
      <Animated.View
        style={[
          styles.channelCard,
          { transform: [{ scale: scaleAnim }] },
          channel.isPrimary && { borderColor: Colors.statusGreen, borderWidth: 1.5 },
        ]}
      >
        <View style={styles.channelTop}>
          <View style={[styles.channelBandBadge, { backgroundColor: bandColor + '22' }]}>
            <View style={[styles.channelBandDot, { backgroundColor: bandColor }]} />
            <Text style={[styles.channelBandText, { color: bandColor }]}>
              {channel.band.replace('_', ' ')}
            </Text>
          </View>
          {channel.isPrimary && (
            <View style={styles.primaryBadge}>
              <Zap color={Colors.statusGreen} size={10} />
              <Text style={styles.primaryBadgeText}>PRIMARY</Text>
            </View>
          )}
          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
            <Trash2 color={Colors.statusRed} size={14} />
          </TouchableOpacity>
        </View>

        <Text style={styles.channelName}>{channel.name}</Text>
        <Text style={styles.channelFreq}>{channel.frequency}</Text>

        <View style={styles.channelMeta}>
          <View style={styles.channelTag}>
            <Text style={styles.channelTagText}>{channel.mode.toUpperCase()}</Text>
          </View>
          {channel.power && (
            <View style={styles.channelTag}>
              <Text style={styles.channelTagText}>{channel.power}</Text>
            </View>
          )}
          {channel.ctcssTone && (
            <View style={styles.channelTag}>
              <Text style={styles.channelTagText}>CTCSS {channel.ctcssTone}</Text>
            </View>
          )}
        </View>

        <Text style={styles.channelPurpose}>{channel.purpose}</Text>
        {channel.notes && (
          <Text style={styles.channelNotes}>{channel.notes}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

function RepeaterCard({
  repeater,
  onDelete,
  onEdit,
}: {
  repeater: CommsRepeater;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <TouchableOpacity style={styles.repeaterCard} onPress={onEdit} activeOpacity={0.8}>
      <View style={styles.repeaterHeader}>
        <Antenna color={Colors.orangeLight} size={18} />
        <View style={{ flex: 1 }}>
          <Text style={styles.repeaterName}>{repeater.name}</Text>
          {repeater.location && (
            <Text style={styles.repeaterLocation}>{repeater.location}</Text>
          )}
        </View>
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
          <Trash2 color={Colors.statusRed} size={14} />
        </TouchableOpacity>
      </View>

      <View style={styles.repeaterFreqs}>
        <View style={styles.repeaterFreqItem}>
          <Text style={styles.repeaterFreqLabel}>INPUT</Text>
          <Text style={styles.repeaterFreqValue}>{repeater.inputFreq}</Text>
        </View>
        <View style={styles.repeaterArrow}>
          <ChevronRight color={Colors.textMuted} size={14} />
        </View>
        <View style={styles.repeaterFreqItem}>
          <Text style={styles.repeaterFreqLabel}>OUTPUT</Text>
          <Text style={styles.repeaterFreqValue}>{repeater.outputFreq}</Text>
        </View>
      </View>

      <View style={styles.repeaterMeta}>
        <View style={styles.channelTag}>
          <Text style={styles.channelTagText}>OFFSET {repeater.offset}</Text>
        </View>
        <View style={styles.channelTag}>
          <Text style={styles.channelTagText}>CTCSS {repeater.ctcssTone}</Text>
        </View>
        {repeater.range && (
          <View style={styles.channelTag}>
            <Text style={styles.channelTagText}>{repeater.range}</Text>
          </View>
        )}
      </View>

      {repeater.notes && (
        <Text style={styles.channelNotes}>{repeater.notes}</Text>
      )}
    </TouchableOpacity>
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
  statusBanner: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 2,
  },
  statusValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600' as const,
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  primaryText: {
    color: Colors.statusGreen,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: Colors.bgElevated,
  },
  tabLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    textAlign: 'center' as const,
  },
  tabLabelActive: {
    color: Colors.orange,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  broadcastButton: {
    backgroundColor: Colors.oliveMuted,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.orange,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  channelCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  channelTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  channelBandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  channelBandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  channelBandText: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  primaryBadgeText: {
    color: Colors.statusGreen,
    fontSize: 8,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  deleteBtn: {
    marginLeft: 'auto' as const,
    padding: 4,
  },
  channelName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
  channelFreq: {
    color: Colors.orangeLight,
    fontSize: 14,
    fontWeight: '600' as const,
    fontVariant: ['tabular-nums'] as any,
    marginTop: 2,
  },
  channelMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  channelTag: {
    backgroundColor: Colors.bgElevated,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  channelTagText: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  channelPurpose: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 8,
    lineHeight: 17,
  },
  channelNotes: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  emptySubtext: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  repeaterCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  repeaterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  repeaterName: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  repeaterLocation: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  repeaterFreqs: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  repeaterFreqItem: {
    flex: 1,
    alignItems: 'center',
  },
  repeaterFreqLabel: {
    color: Colors.textMuted,
    fontSize: 8,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  repeaterFreqValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700' as const,
    fontVariant: ['tabular-nums'] as any,
  },
  repeaterArrow: {
    paddingHorizontal: 8,
  },
  repeaterMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  protoCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  protoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  protoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  protoTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  protoDesc: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  protoSteps: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: Colors.orange,
    fontSize: 10,
    fontWeight: '800' as const,
  },
  stepText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 12,
    lineHeight: 18,
  },
  bandCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  bandName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700' as const,
  },
  bandLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },
  bandBadge: {
    backgroundColor: Colors.bgElevated,
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  bandRange: {
    color: Colors.orangeLight,
    fontSize: 11,
    fontWeight: '700' as const,
  },
  bandFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  bandLicense: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  losCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  losRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  losTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  losFormula: {
    color: Colors.orangeLight,
    fontSize: 16,
    fontWeight: '800' as const,
    textAlign: 'center' as const,
    paddingVertical: 12,
    backgroundColor: Colors.bgElevated,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 6,
  },
  losNote: {
    color: Colors.textMuted,
    fontSize: 10,
    textAlign: 'center' as const,
    marginBottom: 14,
  },
  losTable: {
    gap: 0,
  },
  losTableHeader: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 4,
  },
  losColHeader: {
    flex: 1,
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  losTableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  losCol: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500' as const,
  },
  meshCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  meshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  meshTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  meshContent: {
    gap: 6,
  },
  meshPoint: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  meshDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 14,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 2,
  },
  footerSub: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 4,
  },
});
