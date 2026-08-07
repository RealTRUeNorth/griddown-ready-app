import SwiftUI

struct PressableCard<Content: View>: View {
    let onPress: () -> Void
    @ViewBuilder let content: Content

    @State private var isPressed = false

    var body: some View {
        Button {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            onPress()
        } label: {
            content
                .scaleEffect(isPressed ? 0.97 : 1.0)
                .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isPressed)
        }
        .buttonStyle(.plain)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in isPressed = true }
                .onEnded { _ in isPressed = false }
        )
    }
}

struct SectionLabel: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.system(size: 11, weight: .bold))
            .tracking(2)
            .foregroundStyle(Theme.textMuted)
            .padding(.top, 20)
            .padding(.bottom, 12)
    }
}

struct ProgressBar: View {
    let percent: Int

    var color: Color {
        if percent == 100 { return Theme.statusGreen }
        if percent > 50 { return Theme.statusAmber }
        return Theme.orange
    }

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Theme.bgElevated
                    .clipShape(.rect(cornerRadius: 3))
                color
                    .frame(width: geo.size.width * CGFloat(percent) / 100)
                    .clipShape(.rect(cornerRadius: 3))
            }
        }
        .frame(height: 5)
    }
}

struct BadgeView: View {
    let text: String
    let color: Color

    var body: some View {
        Text(text)
            .font(.system(size: 10, weight: .heavy))
            .tracking(0.5)
            .foregroundStyle(color)
            .padding(.horizontal, 7)
            .padding(.vertical, 2)
            .background(color.opacity(0.15))
            .clipShape(.rect(cornerRadius: 6))
    }
}

struct FAB: View {
    let action: () -> Void

    var body: some View {
        Button {
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            action()
        } label: {
            Image(systemName: "plus")
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 56, height: 56)
                .background(Theme.orange)
                .clipShape(Circle())
                .shadow(color: .black.opacity(0.3), radius: 6, x: 0, y: 4)
        }
    }
}

struct EmptyStateView: View {
    let icon: String
    let title: String
    let subtitle: String

    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 48))
                .foregroundStyle(Theme.textMuted)
            Text(title)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(Theme.textPrimary)
            Text(subtitle)
                .font(.system(size: 13))
                .foregroundStyle(Theme.textMuted)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 20)
        }
        .padding(.vertical, 60)
    }
}

struct FilterChip: View {
    let text: String
    let isActive: Bool
    let activeColor: Color
    let action: () -> Void

    var body: some View {
        Button {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            action()
        } label: {
            Text(text)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(isActive ? .white : Theme.textSecondary)
                .padding(.horizontal, 14)
                .padding(.vertical, 7)
                .background(isActive ? activeColor : Theme.bgCard)
                .clipShape(.rect(cornerRadius: 8))
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(isActive ? activeColor : Theme.border, lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }
}
