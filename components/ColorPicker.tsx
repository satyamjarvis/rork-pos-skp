import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';

interface ColorPickerProps {
  color: string;
  onColorChange: (color: string) => void;
}

const PRESET_COLORS = [
  ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00C7BE'],
  ['#30B0C7', '#32ADE6', '#007AFF', '#5856D6', '#AF52DE'],
  ['#FF2D55', '#A2845E', '#8E8E93', '#000000', '#FFFFFF'],
];

export default function ColorPicker({ color, onColorChange }: ColorPickerProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'grid' | 'spectrum' | 'sliders'>('grid');
  const [hexInput, setHexInput] = useState(color);

  // RGB values for sliders
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  };

  const [rgb, setRgb] = useState(hexToRgb(color));

  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: number) => {
    const newRgb = { ...rgb, [channel]: value };
    setRgb(newRgb);
    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHexInput(hex);
    onColorChange(hex);
  };

  const handleHexInput = (text: string) => {
    setHexInput(text);
    if (/^#[0-9A-F]{6}$/i.test(text)) {
      onColorChange(text);
      setRgb(hexToRgb(text));
    }
  };

  // Custom color picker for all platforms
  return (
    <>
      <TouchableOpacity
        style={styles.colorPreview}
        onPress={() => setShowModal(true)}
      >
        <View style={[styles.colorBox, { backgroundColor: color }]} />
        <Text style={styles.colorText}>{color}</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Velg farge</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.doneButton}>Ferdig</Text>
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'grid' && styles.tabActive]}
                onPress={() => setSelectedTab('grid')}
              >
                <Text style={[styles.tabText, selectedTab === 'grid' && styles.tabTextActive]}>
                  Rutenett
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'spectrum' && styles.tabActive]}
                onPress={() => setSelectedTab('spectrum')}
              >
                <Text style={[styles.tabText, selectedTab === 'spectrum' && styles.tabTextActive]}>
                  Spektrum
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'sliders' && styles.tabActive]}
                onPress={() => setSelectedTab('sliders')}
              >
                <Text style={[styles.tabText, selectedTab === 'sliders' && styles.tabTextActive]}>
                  Skyveknapper
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.pickerContent}>
              {/* Grid Tab */}
              {selectedTab === 'grid' && (
                <View style={styles.gridContainer}>
                  {PRESET_COLORS.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.colorRow}>
                      {row.map((presetColor) => (
                        <TouchableOpacity
                          key={presetColor}
                          style={[
                            styles.colorGridItem,
                            { backgroundColor: presetColor },
                            color.toUpperCase() === presetColor.toUpperCase() && styles.colorGridItemSelected
                          ]}
                          onPress={() => {
                            onColorChange(presetColor);
                            setHexInput(presetColor);
                            setRgb(hexToRgb(presetColor));
                          }}
                        >
                          {color.toUpperCase() === presetColor.toUpperCase() && (
                            <View style={styles.checkmark}>
                              <Text style={styles.checkmarkText}>✓</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))}
                </View>
              )}

              {/* Spectrum Tab */}
              {selectedTab === 'spectrum' && (
                <View style={styles.spectrumContainer}>
                  <View style={styles.spectrumGrid}>
                    {Array.from({ length: 12 }).map((_, hueIndex) => {
                      const hue = (hueIndex * 30);
                      return (
                        <View key={hueIndex} style={styles.spectrumColumn}>
                          {Array.from({ length: 10 }).map((_, satIndex) => {
                            const sat = 100 - (satIndex * 10);
                            const light = 50;
                            const hslColor = `hsl(${hue}, ${sat}%, ${light}%)`;
                            
                            return (
                              <TouchableOpacity
                                key={satIndex}
                                style={[
                                  styles.spectrumCell,
                                  { backgroundColor: hslColor }
                                ]}
                                onPress={() => {
                                  // Convert HSL to hex (approximation)
                                  const hex = hslToHex(hue, sat, light);
                                  onColorChange(hex);
                                  setHexInput(hex);
                                  setRgb(hexToRgb(hex));
                                }}
                              />
                            );
                          })}
                        </View>
                      );
                    })}
                  </View>

                  {/* Grayscale row */}
                  <View style={styles.grayscaleRow}>
                    {Array.from({ length: 11 }).map((_, index) => {
                      const value = Math.round((index / 10) * 255);
                      const grayHex = rgbToHex(value, value, value);
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.grayscaleCell,
                            { backgroundColor: grayHex }
                          ]}
                          onPress={() => {
                            onColorChange(grayHex);
                            setHexInput(grayHex);
                            setRgb({ r: value, g: value, b: value });
                          }}
                        />
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Sliders Tab */}
              {selectedTab === 'sliders' && (
                <View style={styles.slidersContainer}>
                  {/* Red Slider */}
                  <View style={styles.sliderRow}>
                    <Text style={styles.sliderLabel}>Rød</Text>
                    <View style={styles.sliderTrack}>
                      <View style={[styles.sliderFill, { 
                        width: `${(rgb.r / 255) * 100}%`,
                        backgroundColor: '#FF3B30'
                      }]} />
                      <TouchableOpacity
                        style={[styles.sliderThumb, { 
                          left: `${(rgb.r / 255) * 100}%`,
                          backgroundColor: rgbToHex(rgb.r, 0, 0)
                        }]}
                        onPress={(e) => {
                          // This is simplified - in production you'd use PanResponder
                        }}
                      />
                    </View>
                    <TextInput
                      style={styles.sliderInput}
                      value={rgb.r.toString()}
                      onChangeText={(text) => {
                        const value = parseInt(text) || 0;
                        handleRgbChange('r', Math.min(255, Math.max(0, value)));
                      }}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                  </View>

                  {/* Green Slider */}
                  <View style={styles.sliderRow}>
                    <Text style={styles.sliderLabel}>Grønn</Text>
                    <View style={styles.sliderTrack}>
                      <View style={[styles.sliderFill, { 
                        width: `${(rgb.g / 255) * 100}%`,
                        backgroundColor: '#34C759'
                      }]} />
                      <TouchableOpacity
                        style={[styles.sliderThumb, { 
                          left: `${(rgb.g / 255) * 100}%`,
                          backgroundColor: rgbToHex(0, rgb.g, 0)
                        }]}
                      />
                    </View>
                    <TextInput
                      style={styles.sliderInput}
                      value={rgb.g.toString()}
                      onChangeText={(text) => {
                        const value = parseInt(text) || 0;
                        handleRgbChange('g', Math.min(255, Math.max(0, value)));
                      }}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                  </View>

                  {/* Blue Slider */}
                  <View style={styles.sliderRow}>
                    <Text style={styles.sliderLabel}>Blå</Text>
                    <View style={styles.sliderTrack}>
                      <View style={[styles.sliderFill, { 
                        width: `${(rgb.b / 255) * 100}%`,
                        backgroundColor: '#007AFF'
                      }]} />
                      <TouchableOpacity
                        style={[styles.sliderThumb, { 
                          left: `${(rgb.b / 255) * 100}%`,
                          backgroundColor: rgbToHex(0, 0, rgb.b)
                        }]}
                      />
                    </View>
                    <TextInput
                      style={styles.sliderInput}
                      value={rgb.b.toString()}
                      onChangeText={(text) => {
                        const value = parseInt(text) || 0;
                        handleRgbChange('b', Math.min(255, Math.max(0, value)));
                      }}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                  </View>

                  {/* Color Preview */}
                  <View style={styles.colorPreviewLarge}>
                    <View style={[styles.colorPreviewBox, { backgroundColor: color }]} />
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Hex Input */}
            <View style={styles.hexInputContainer}>
              <Text style={styles.hexLabel}>Hex:</Text>
              <TextInput
                style={styles.hexInput}
                value={hexInput}
                onChangeText={handleHexInput}
                autoCapitalize="characters"
                maxLength={7}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// Helper function to convert HSL to Hex
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color);
  };
  return `#${[f(0), f(8), f(4)].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

const styles = StyleSheet.create({
  colorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  colorBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  colorText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#111827',
    fontFamily: 'monospace' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
  },
  doneButton: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#111827',
  },
  pickerContent: {
    maxHeight: 400,
  },
  gridContainer: {
    gap: 12,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  colorGridItem: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorGridItemSelected: {
    borderColor: '#111827',
    borderWidth: 3,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
  },
  spectrumContainer: {
    gap: 16,
  },
  spectrumGrid: {
    flexDirection: 'row',
    gap: 2,
  },
  spectrumColumn: {
    flex: 1,
    gap: 2,
  },
  spectrumCell: {
    height: 28,
    borderRadius: 4,
  },
  grayscaleRow: {
    flexDirection: 'row',
    gap: 4,
  },
  grayscaleCell: {
    flex: 1,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  slidersContainer: {
    gap: 24,
    paddingVertical: 20,
  },
  sliderRow: {
    gap: 12,
  },
  sliderLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#111827',
  },
  sliderTrack: {
    height: 32,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    position: 'relative' as const,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 16,
  },
  sliderThumb: {
    position: 'absolute' as const,
    top: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#fff',
    marginLeft: -16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#111827',
    textAlign: 'center' as const,
    fontFamily: 'monospace' as const,
  },
  colorPreviewLarge: {
    marginTop: 20,
  },
  colorPreviewBox: {
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  hexInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  hexLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  hexInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#111827',
    fontFamily: 'monospace' as const,
  },
});
