import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { investmentStatusOptions, investmentTypeOptions } from '../../constants/investmentMeta';

const InvestmentFormModal = ({
  visible,
  title,
  ui,
  isSaving,
  onClose,
  onSubmit,
  submitLabel,
  values,
  setters,
  showPropertyFields,
  showYieldFields,
  showMaturityFields,
  showExitFields,
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={[styles.modalBackdrop, { backgroundColor: ui.modalOverlay }]}>
      <View style={[styles.modalCard, { backgroundColor: ui.panelAlt, borderColor: ui.border }]}>
        <Text style={[styles.modalTitle, { color: ui.text }]}>{title}</Text>

        <TextInput
          placeholder="Nom de l'actif"
          placeholderTextColor={ui.placeholder}
          style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
          value={values.assetName}
          onChangeText={setters.setAssetName}
        />
        <TextInput
          placeholder="Symbole (optionnel)"
          autoCapitalize="characters"
          placeholderTextColor={ui.placeholder}
          style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
          value={values.symbol}
          onChangeText={setters.setSymbol}
        />
        <TextInput
          placeholder="Quantite"
          keyboardType="decimal-pad"
          placeholderTextColor={ui.placeholder}
          style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
          value={values.quantity}
          onChangeText={setters.setQuantity}
        />
        <TextInput
          placeholder="Prix moyen d'achat"
          keyboardType="decimal-pad"
          placeholderTextColor={ui.placeholder}
          style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
          value={values.averageBuyPrice}
          onChangeText={setters.setAverageBuyPrice}
        />
        <TextInput
          placeholder="Localisation (optionnel)"
          placeholderTextColor={ui.placeholder}
          style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
          value={values.location}
          onChangeText={setters.setLocation}
        />

        {showPropertyFields ? (
          <TextInput
            placeholder="Superficie en m2 (optionnel)"
            keyboardType="decimal-pad"
            placeholderTextColor={ui.placeholder}
            style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
            value={values.area}
            onChangeText={setters.setArea}
          />
        ) : null}

        <TextInput
          placeholder="Date d'achat YYYY-MM-DD (optionnel)"
          placeholderTextColor={ui.placeholder}
          style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
          value={values.purchaseDate}
          onChangeText={setters.setPurchaseDate}
        />
        <TextInput
          placeholder="Valeur actuelle estimee (optionnel)"
          keyboardType="decimal-pad"
          placeholderTextColor={ui.placeholder}
          style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
          value={values.estimatedCurrentValue}
          onChangeText={setters.setEstimatedCurrentValue}
        />

        {showYieldFields ? (
          <TextInput
            placeholder="Rendement annuel attendu %"
            keyboardType="decimal-pad"
            placeholderTextColor={ui.placeholder}
            style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
            value={values.expectedAnnualReturnRate}
            onChangeText={setters.setExpectedAnnualReturnRate}
          />
        ) : null}

        {showMaturityFields ? (
          <TextInput
            placeholder="Date d'echeance YYYY-MM-DD"
            placeholderTextColor={ui.placeholder}
            style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
            value={values.maturityDate}
            onChangeText={setters.setMaturityDate}
          />
        ) : null}

        {showExitFields ? (
          <>
            <TextInput
              placeholder="Date de sortie YYYY-MM-DD"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={values.exitDate}
              onChangeText={setters.setExitDate}
            />
            <TextInput
              placeholder="Montant de sortie"
              keyboardType="decimal-pad"
              placeholderTextColor={ui.placeholder}
              style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
              value={values.exitValue}
              onChangeText={setters.setExitValue}
            />
          </>
        ) : null}

        <TextInput
          placeholder="Structure / cooperative / banque (optionnel)"
          placeholderTextColor={ui.placeholder}
          style={[styles.input, { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText }]}
          value={values.institution}
          onChangeText={setters.setInstitution}
        />
        <TextInput
          placeholder="Notes (optionnel)"
          placeholderTextColor={ui.placeholder}
          style={[
            styles.input,
            styles.noteInput,
            { borderColor: ui.inputBorder, backgroundColor: ui.inputBg, color: ui.inputText },
          ]}
          value={values.notes}
          onChangeText={setters.setNotes}
          multiline
        />

        <View style={styles.segmentWrap}>
          {['XOF', 'USD', 'EUR'].map((option) => (
            <Pressable
              key={option}
              style={[
                styles.segment,
                { borderColor: ui.inputBorder, backgroundColor: ui.segmentBg },
                values.currency === option && { borderColor: ui.primary, backgroundColor: ui.segmentActiveBg },
              ]}
              onPress={() => setters.setCurrency(option)}
            >
              <Text style={[styles.segmentText, { color: values.currency === option ? ui.text : ui.textSecondary }]}>{option}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.segmentWrap}>
          {investmentTypeOptions.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.segment,
                { borderColor: ui.inputBorder, backgroundColor: ui.segmentBg },
                values.assetType === option.value && { borderColor: ui.primary, backgroundColor: ui.segmentActiveBg },
              ]}
              onPress={() => setters.setAssetType(option.value)}
            >
              <Text style={[styles.segmentText, { color: values.assetType === option.value ? ui.text : ui.textSecondary }]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.segmentWrap}>
          {investmentStatusOptions.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.segment,
                { borderColor: ui.inputBorder, backgroundColor: ui.segmentBg },
                values.status === option.value && { borderColor: ui.primary, backgroundColor: ui.segmentActiveBg },
              ]}
              onPress={() => setters.setStatus(option.value)}
            >
              <Text style={[styles.segmentText, { color: values.status === option.value ? ui.text : ui.textSecondary }]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.modalActions}>
          <Pressable style={[styles.modalBtn, { backgroundColor: ui.segmentBg }]} onPress={onClose}>
            <Text style={[styles.modalBtnText, { color: ui.text }]}>Annuler</Text>
          </Pressable>
          <Pressable style={[styles.modalBtn, { backgroundColor: ui.primary }]} onPress={onSubmit} disabled={isSaving}>
            <Text style={[styles.modalBtnText, { color: ui.onPrimary }]}>{isSaving ? `${submitLabel}...` : submitLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, borderTopWidth: 1, gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  noteInput: { minHeight: 72, textAlignVertical: 'top' },
  segmentWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  segment: { borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  segmentText: { fontWeight: '700', fontSize: 12 },
  modalActions: { marginTop: 4, flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  modalBtnText: { fontWeight: '700' },
});

export default InvestmentFormModal;
