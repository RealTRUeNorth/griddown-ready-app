import SwiftUI

struct CommsView: View {
    @Environment(AppStore.self) var store
    @State private var activeTab: CommsTab = .channels
    @State private var expandedProtocol: String?
    @State private var showingAddChannel = false
    @State private var showingAddRepeater = false
    @State private var editingChannel: CommsChannel?
    @State private var editingRepeater: CommsRepeater?
    @State private var pendingDeleteChannel: CommsChannel?
    @State private var pendingDeleteRepeater: CommsRepeater?

    enum CommsTab: String, CaseIterable {
        case channels, repeaters, protocols, reference
        var label: String { rawValue.capitalized }
    }

    var body: some View {
        VStack(spacing: 0) {
            tabBar
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    switch activeTab {
                    case .channels: channelsTab
                    case .repeaters: repeatersTab
                    case .protocols: protocolsTab
                    case .reference: referenceTab
                    }
                }
                .padding(16)
                .padding(.bottom, 40)
            }
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("Comms")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showingAddChannel) {
            AddChannelView()
        }
        .sheet(isPresented: $showingAddRepeater) {
            AddRepeaterView()
        }
        .sheet(item: $editingChannel) { channel in
            AddChannelView(existing: channel)
        }
        .sheet(item: $editingRepeater) { repeater in
            AddRepeaterView(existing: repeater)
        }
        .confirmationDialog(
            "Remove \"\(pendingDeleteChannel?.name ?? "channel")\" from your comms plan?",
            isPresented: Binding(
                get: { pendingDeleteChannel != nil },
                set: { if !$0 { pendingDeleteChannel = nil } }
            ),
            titleVisibility: .visible
        ) {
            Button("Remove", role: .destructive) {
                if let channel = pendingDeleteChannel {
                    store.removeCommsChannel(channel.id)
                    UINotificationFeedbackGenerator().notificationOccurred(.warning)
                }
                pendingDeleteChannel = nil
            }
            Button("Cancel", role: .cancel) { pendingDeleteChannel = nil }
        }
        .confirmationDialog(
            "Remove \"\(pendingDeleteRepeater?.name ?? "repeater")\" from your comms plan?",
            isPresented: Binding(
                get: { pendingDeleteRepeater != nil },
                set: { if !$0 { pendingDeleteRepeater = nil } }
            ),
            titleVisibility: .visible
        ) {
            Button("Remove", role: .destructive) {
                if let repeater = pendingDeleteRepeater {
                    store.removeCommsRepeater(repeater.id)
                    UINotificationFeedbackGenerator().notificationOccurred(.warning)
                }
                pendingDeleteRepeater = nil
            }
            Button("Cancel", role: .cancel) { pendingDeleteRepeater = nil }
        }
    }

    private var tabBar: some View {
        HStack(spacing: 0) {
            ForEach(CommsTab.allCases, id: \.self) { tab in
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                        activeTab = tab
                    }
                } label: {
                    VStack(spacing: 6) {
                        Text(tab.label)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(activeTab == tab ? Theme.orange : Theme.textMuted)
                        Rectangle()
                            .fill(activeTab == tab ? Theme.orange : Color.clear)
                            .frame(height: 2)
                    }
                }
                .buttonStyle(.plain)
                .frame(maxWidth: .infinity)
            }
        }
        .background(Theme.bgCard)
    }

    private var channelsTab: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(store.commsChannels) { channel in
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    editingChannel = channel
                } label: {
                    channelCard(channel)
                }
                .buttonStyle(.plain)
                .contextMenu {
                    Button {
                        editingChannel = channel
                    } label: {
                        Label("Edit", systemImage: "pencil")
                    }
                    Button(role: .destructive) {
                        pendingDeleteChannel = channel
                    } label: {
                        Label("Delete", systemImage: "trash")
                    }
                }
            }
        }
        .overlay(alignment: .bottomTrailing) {
            FAB { showingAddChannel = true }
                .padding(20)
        }
    }

    private func channelCard(_ ch: CommsChannel) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: "antenna.radiowaves.left.and.right")
                    .font(.system(size: 18))
                    .foregroundStyle(ch.band.color)
                    .frame(width: 40, height: 40)
                    .background(ch.band.color.opacity(0.15))
                    .clipShape(.rect(cornerRadius: 10))
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text(ch.name)
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(Theme.textPrimary)
                        if ch.isPrimary == true {
                            BadgeView(text: "PRIMARY", color: Theme.orange)
                        }
                    }
                    Text(ch.purpose)
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.textSecondary)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text(ch.frequency)
                        .font(.system(size: 14, weight: .bold, design: .monospaced))
                        .foregroundStyle(Theme.textPrimary)
                    Text(ch.band.rawValue)
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(ch.band.color)
                }
            }
            HStack(spacing: 16) {
                if let power = ch.power {
                    labelValue("Power", power)
                }
                if let tone = ch.ctcssTone {
                    labelValue("CTCSS", tone)
                }
                labelValue("Mode", ch.mode.label)
            }
            if let notes = ch.notes, !notes.isEmpty {
                Text(notes)
                    .font(.system(size: 11))
                    .foregroundStyle(Theme.textMuted)
            }
        }
        .padding(14)
        .background(Theme.bgCard)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
        .clipShape(.rect(cornerRadius: 12))
    }

    private func labelValue(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label.uppercased())
                .font(.system(size: 9, weight: .bold))
                .tracking(1)
                .foregroundStyle(Theme.textMuted)
            Text(value)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(Theme.textPrimary)
        }
    }

    private var repeatersTab: some View {
        VStack(alignment: .leading, spacing: 8) {
            if store.commsRepeaters.isEmpty {
                EmptyStateView(icon: "antenna.radiowaves.left.and.right", title: "No repeaters", subtitle: "Add repeater stations to extend your comms range")
            }
            ForEach(store.commsRepeaters) { rpt in
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    editingRepeater = rpt
                } label: {
                    repeaterCard(rpt)
                }
                .buttonStyle(.plain)
                .contextMenu {
                    Button {
                        editingRepeater = rpt
                    } label: {
                        Label("Edit", systemImage: "pencil")
                    }
                    Button(role: .destructive) {
                        pendingDeleteRepeater = rpt
                    } label: {
                        Label("Delete", systemImage: "trash")
                    }
                }
            }
        }
        .overlay(alignment: .bottomTrailing) {
            FAB { showingAddRepeater = true }
                .padding(20)
        }
    }

    private func repeaterCard(_ rpt: CommsRepeater) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: "tower.signal")
                    .font(.system(size: 18))
                    .foregroundStyle(Theme.orange)
                    .frame(width: 40, height: 40)
                    .background(Theme.orangeMuted)
                    .clipShape(.rect(cornerRadius: 10))
                VStack(alignment: .leading, spacing: 2) {
                    Text(rpt.name)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(Theme.textPrimary)
                    if let loc = rpt.location {
                        Text(loc)
                            .font(.system(size: 12))
                            .foregroundStyle(Theme.textSecondary)
                    }
                }
                Spacer()
                if let range = rpt.range {
                    BadgeView(text: range, color: Theme.olive)
                }
            }
            HStack(spacing: 16) {
                labelValue("Input", rpt.inputFreq)
                labelValue("Output", rpt.outputFreq)
                labelValue("Offset", rpt.offset)
                labelValue("CTCSS", rpt.ctcssTone)
            }
            if let notes = rpt.notes, !notes.isEmpty {
                Text(notes)
                    .font(.system(size: 11))
                    .foregroundStyle(Theme.textMuted)
            }
        }
        .padding(14)
        .background(Theme.bgCard)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
        .clipShape(.rect(cornerRadius: 12))
    }

    private var protocolsTab: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(MockData.commsProtocols) { proto in
                protocolCard(proto)
            }
        }
    }

    private func protocolCard(_ proto: CommsProtocol) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Button {
                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                    expandedProtocol = expandedProtocol == proto.id ? nil : proto.id
                }
            } label: {
                HStack {
                    Image(systemName: "list.bullet.rectangle.portrait.fill")
                        .font(.system(size: 18))
                        .foregroundStyle(Theme.orange)
                        .frame(width: 40, height: 40)
                        .background(Theme.orangeMuted)
                        .clipShape(.rect(cornerRadius: 10))
                    VStack(alignment: .leading, spacing: 2) {
                        Text(proto.title)
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(Theme.textPrimary)
                        Text(proto.description)
                            .font(.system(size: 12))
                            .foregroundStyle(Theme.textSecondary)
                            .lineLimit(expandedProtocol == proto.id ? nil : 1)
                    }
                    Spacer()
                    Image(systemName: "chevron.down")
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.textMuted)
                        .rotationEffect(.degrees(expandedProtocol == proto.id ? 180 : 0))
                }
            }
            .buttonStyle(.plain)

            if expandedProtocol == proto.id {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(Array(proto.steps.enumerated()), id: \.offset) { idx, step in
                        HStack(alignment: .top, spacing: 10) {
                            Text("\(idx + 1)")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(Theme.orange)
                                .frame(width: 22, height: 22)
                                .background(Theme.orange.opacity(0.15))
                                .clipShape(Circle())
                            Text(step)
                                .font(.system(size: 13))
                                .foregroundStyle(Theme.textPrimary)
                        }
                    }
                }
                .padding(.top, 12)
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .padding(14)
        .background(Theme.bgCard)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Theme.border, lineWidth: 1))
        .clipShape(.rect(cornerRadius: 12))
    }

    private var referenceTab: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionLabel(text: "BAND REFERENCE")
            ForEach(CommsBand.allCases, id: \.self) { band in
                HStack(spacing: 12) {
                    Image(systemName: "antenna.radiowaves.left.and.right")
                        .font(.system(size: 16))
                        .foregroundStyle(band.color)
                        .frame(width: 36, height: 36)
                        .background(band.color.opacity(0.15))
                        .clipShape(.rect(cornerRadius: 8))
                    VStack(alignment: .leading, spacing: 2) {
                        Text(band.rawValue)
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(Theme.textPrimary)
                        Text(band.label)
                            .font(.system(size: 12))
                            .foregroundStyle(Theme.textSecondary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(band.range)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Theme.textPrimary)
                        Text(band.license)
                            .font(.system(size: 10))
                            .foregroundStyle(Theme.textMuted)
                    }
                }
                .padding(12)
                .background(Theme.bgCard)
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.border, lineWidth: 1))
                .clipShape(.rect(cornerRadius: 10))
            }
        }
    }
}
