import ContactsUI
import SwiftUI

/// System contact picker for importing a member's name and phone number.
/// Uses CNContactPickerViewController, which requires no contact permission
/// because the user explicitly selects a single contact.
struct ContactPicker: UIViewControllerRepresentable {
    var onPick: (String, String?) -> Void

    func makeUIViewController(context: Context) -> CNContactPickerViewController {
        let picker = CNContactPickerViewController()
        picker.delegate = context.coordinator
        picker.displayedPropertyKeys = [
            CNContactGivenNameKey,
            CNContactFamilyNameKey,
            CNContactPhoneNumbersKey,
        ]
        return picker
    }

    func updateUIViewController(_ uiViewController: CNContactPickerViewController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(onPick: onPick)
    }

    final class Coordinator: NSObject, CNContactPickerDelegate {
        let onPick: (String, String?) -> Void

        init(onPick: @escaping (String, String?) -> Void) {
            self.onPick = onPick
        }

        func contactPicker(_ picker: CNContactPickerViewController, didSelect contact: CNContact) {
            let name = [contact.givenName, contact.familyName]
                .filter { !$0.isEmpty }
                .joined(separator: " ")
            let phone = contact.phoneNumbers.first?.value.stringValue
                .replacingOccurrences(of: " ", with: "")
            onPick(name, phone)
        }
    }
}
