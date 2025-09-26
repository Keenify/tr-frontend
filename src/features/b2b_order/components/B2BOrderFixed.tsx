import React, { useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { generateSnackOrderReport } from '../utils/snackOrderReportGenerator';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import '../styles/B2BOrder.css';

interface B2BOrderProps {
  session: Session | null;
}

const B2BOrderFixed: React.FC<B2BOrderProps> = ({ session }) => {
  // Handle both authenticated and public access
  const userId = session?.user?.id || '';
  const { companyInfo } = useUserAndCompanyData(userId);

  // Form state
  const [pax, setPax] = useState<string>('');
  const [pricePerPerson, setPricePerPerson] = useState<string>('');
  const [dietaryRestriction, setDietaryRestriction] = useState<'halal' | 'non-halal'>('halal');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');

  // UI state
  const [showTable, setShowTable] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<any[]>([]);

  // Validation
  const [errors, setErrors] = useState<{ pax?: string; price?: string }>({});

  const validateInputs = () => {
    const newErrors: { pax?: string; price?: string } = {};

    if (!pax || isNaN(parseInt(pax)) || parseInt(pax) < 1) {
      newErrors.pax = 'Please enter a valid number of people (minimum 1)';
    }

    if (!pricePerPerson || isNaN(parseFloat(pricePerPerson)) || parseFloat(pricePerPerson) < 1) {
      newErrors.price = 'Please enter a valid price per person (minimum RM 1)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePaxChange = (value: string) => {
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setPax(value);
      if (errors.pax) {
        setErrors({ ...errors, pax: undefined });
      }
    }
  };

  const handlePriceChange = (value: string) => {
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPricePerPerson(value);
      if (errors.price) {
        setErrors({ ...errors, price: undefined });
      }
    }
  };

  const handleGenerateGifts = async () => {
    if (!validateInputs()) {
      return;
    }

    console.log('Starting gift generation...');
    setIsGenerating(true);

    // Small delay to ensure state updates
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const paxNum = parseInt(pax);
      const priceNum = parseFloat(pricePerPerson);
      const isHalal = dietaryRestriction === 'halal';

      // Available gift box options with actual pricing
      const giftBoxOptions = [
        {
          name: "Premium Assorted Gift Box",
          basePrice: 25.00, // Base price per box
          products: {
            "Popcorn Mix": { flavors: isHalal ? ["Tom Yum", "Mala", "Salted Caramel"] : ["Tom Yum", "Mala", "Chicken Floss"], count: 3, unitCost: 3.50 },
            "Brownie Crisps": { flavors: ["Chocolate"], count: 2, unitCost: 4.00 },
            "Crispy Cones": { flavors: ["Nasi Lemak"], count: 1, unitCost: 5.50 }
          }
        },
        {
          name: "Deluxe Snack Gift Box",
          basePrice: 22.00,
          products: {
            "Popcorn Mix": { flavors: isHalal ? ["Chocolate", "Salted Caramel"] : ["Chocolate", "Chicken Floss"], count: 2, unitCost: 3.50 },
            "YUMI Corn Sticks": { flavors: ["Pulut Hitam", "Chilli Crab"], count: 2, unitCost: 4.50 },
            "Crispy Cones": { flavors: ["Original"], count: 1, unitCost: 5.50 }
          }
        },
        {
          name: "Signature Flavor Gift Box",
          basePrice: 28.00,
          products: {
            "Popcorn Mix": { flavors: isHalal ? ["Tom Yum", "Mala", "Chocolate", "Salted Caramel"] : ["Tom Yum", "Mala", "Chocolate", "Chicken Floss"], count: 4, unitCost: 3.50 },
            "Brownie Crisps": { flavors: ["Original"], count: 1, unitCost: 4.00 }
          }
        }
      ];

      // Randomly select a gift box configuration
      const selectedGiftBox = giftBoxOptions[Math.floor(Math.random() * giftBoxOptions.length)];

      // Calculate actual cost of gift box contents
      let calculatedBoxCost = 0;
      Object.values(selectedGiftBox.products).forEach(product => {
        calculatedBoxCost += product.unitCost * product.count;
      });

      // Use the higher of base price or calculated cost (with margin)
      const actualBoxPrice = Math.max(selectedGiftBox.basePrice, calculatedBoxCost * 1.3); // 30% margin

      // Check if user's budget per person is sufficient
      let finalBoxPrice = actualBoxPrice;
      let budgetMessage = "";

      if (priceNum < actualBoxPrice) {
        // If budget is less than actual price, adjust the box contents or show budget message
        finalBoxPrice = actualBoxPrice; // Keep actual price
        budgetMessage = `(Budget: RM ${priceNum.toFixed(2)}/person, Actual: RM ${actualBoxPrice.toFixed(2)}/person)`;
      }

      // Calculate quantities and pricing
      const boxesNeeded = paxNum; // 1 box per person
      const totalAmount = boxesNeeded * finalBoxPrice;

      // Generate all flavors list from selected products
      const allFlavors: string[] = [];
      Object.values(selectedGiftBox.products).forEach(product => {
        allFlavors.push(...product.flavors);
      });

      // Generate the table data
      const giftBoxItem = {
        productDescription: selectedGiftBox.name,
        pax: paxNum,
        pricePerBox: finalBoxPrice.toFixed(2),
        total: totalAmount.toFixed(2),
        flavors: allFlavors,
        budgetMessage,
        specialInstructions
      };

      console.log('Generated gift box item:', giftBoxItem);
      setGeneratedItems([giftBoxItem]);
      setShowTable(true);

    } catch (error) {
      console.error('Error generating gift suggestions:', error);
      alert('Failed to generate gift suggestions. Please try again.');
    } finally {
      console.log('Finished gift generation');
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (isGenerating) return; // Prevent double clicks

    console.log('Regenerate button clicked');
    await handleGenerateGifts();
  };

  return (
    <div className="gift-suggestion-page">
      <div className="gift-suggestion-container">
        <div className="gift-suggestion-header">
          <h2>Gift Suggestion Generator</h2>
          <p className="subtitle">Generate personalized gift suggestions for your team or clients</p>
        </div>

        <div className="form-content">
          {/* Three input fields in a row */}
          <div className="input-row">
            <div className="input-group">
              <div className="input-field-container">
                <label htmlFor="pax">Number of People</label>
                <div className="input-with-error">
                  <input
                    id="pax"
                    type="text"
                    value={pax}
                    onChange={(e) => handlePaxChange(e.target.value)}
                    placeholder="Enter number"
                    className={`form-input ${errors.pax ? 'error' : ''}`}
                  />
                  {errors.pax && <span className="error-message">{errors.pax}</span>}
                </div>
              </div>
            </div>

            <div className="input-group">
              <div className="input-field-container">
                <label htmlFor="price">Price per Person (RM)</label>
                <div className="input-with-error">
                  <input
                    id="price"
                    type="text"
                    value={pricePerPerson}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    placeholder="0.00"
                    className={`form-input ${errors.price ? 'error' : ''}`}
                  />
                  {errors.price && <span className="error-message">{errors.price}</span>}
                </div>
              </div>
            </div>

            <div className="input-group">
              <div className="input-field-container">
                <label htmlFor="dietary">Dietary Restriction</label>
                <div className="input-with-error">
                  <select
                    id="dietary"
                    value={dietaryRestriction}
                    onChange={(e) => setDietaryRestriction(e.target.value as 'halal' | 'non-halal')}
                    className="form-select"
                  >
                    <option value="halal">Halal</option>
                    <option value="non-halal">Non-Halal</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Special instructions box */}
          <div className="special-instructions">
            <label htmlFor="instructions">Special Instructions (Optional)</label>
            <textarea
              id="instructions"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any specific requirements, preferences, or notes..."
              className="instructions-textarea"
              rows={3}
            />
          </div>

          {/* Generate button (when no table) */}
          {!showTable && (
            <div className="button-container">
              <button
                onClick={handleGenerateGifts}
                disabled={isGenerating}
                className="generate-btn"
              >
{isGenerating ? 'Generating...' : 'Generate Gift Suggestions'}
              </button>
            </div>
          )}

          {/* Results table */}
          {showTable && (
            <div className="results-section">
              <h3>Suggested Gift Items</h3>
              <div className="results-table">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "60%" }}>Product Description & Packaging</th>
                      <th style={{ width: "40%" }}>Pax & Price Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedItems.map((item, index) => (
                      <tr key={index}>
                        <td style={{ verticalAlign: "top", padding: "1rem" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                            {/* Product Info */}
                            <div style={{ flex: 1 }}>
                              <div>
                                <strong style={{ fontSize: "1.1rem" }}>{item.productDescription}</strong>
                              </div>
                              <div style={{ marginTop: "0.5rem", color: "#666" }}>
                                <strong>Contains:</strong>
                                <div style={{ marginLeft: "0.5rem", marginTop: "0.25rem" }}>
                                  {item.flavors.map((flavor, i) => (
                                    <div key={i} style={{ marginBottom: "0.2rem" }}>
                                      • {flavor}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Packaging Images */}
                            <div style={{ textAlign: "center", minWidth: "200px" }}>
                              {/* Main gift box image */}
                              <div style={{ marginBottom: "1rem" }}>
                                <img
                                  src="https://via.placeholder.com/180x120/667eea/FFFFFF?text=Gift+Box"
                                  alt="Gift Box"
                                  style={{
                                    width: "180px",
                                    height: "120px",
                                    border: "2px solid #667eea",
                                    borderRadius: "8px",
                                    boxShadow: "0 2px 8px rgba(102, 126, 234, 0.2)"
                                  }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              </div>

                              {/* Individual flavor packaging images */}
                              <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(4, 45px)",
                                gap: "8px",
                                justifyContent: "center",
                                padding: "12px",
                                backgroundColor: "#f8fafc",
                                borderRadius: "8px",
                                border: "1px solid #e2e8f0"
                              }}>
                                {item.flavors.slice(0, 8).map((flavor, i) => {
                                  const colorMap: {[key: string]: string} = {
                                    "Tom Yum": "FF6B35",
                                    "Mala": "8B0000",
                                    "Salted Caramel": "FFA500",
                                    "Chocolate": "8B4513",
                                    "Chicken Floss": "FFB6C1",
                                    "Nasi Lemak": "32CD32",
                                    "Pulut Hitam": "800080",
                                    "Chilli Crab": "FF4500",
                                    "Original": "87CEEB"
                                  };
                                  const bgColor = colorMap[flavor] || "666666";
                                  const initials = flavor.split(' ').map(w => w[0]).join('').substring(0, 2);

                                  return (
                                    <div key={i} style={{ position: "relative" }}>
                                      <img
                                        src={`https://via.placeholder.com/45x45/${bgColor}/FFFFFF?text=${encodeURIComponent(initials)}`}
                                        alt={flavor}
                                        style={{
                                          width: "45px",
                                          height: "45px",
                                          borderRadius: "6px",
                                          border: "2px solid white",
                                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                          cursor: "pointer"
                                        }}
                                        title={flavor}
                                        onError={(e) => {
                                          // Fallback to colored div if image fails
                                          const target = e.currentTarget;
                                          target.style.display = "none";
                                          const fallbackDiv = target.nextSibling as HTMLElement;
                                          if (fallbackDiv) fallbackDiv.style.display = "flex";
                                        }}
                                      />
                                      <div
                                        style={{
                                          width: "45px",
                                          height: "45px",
                                          backgroundColor: `#${bgColor}`,
                                          color: "white",
                                          fontSize: "12px",
                                          fontWeight: "bold",
                                          display: "none",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          borderRadius: "6px",
                                          border: "2px solid white",
                                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                          cursor: "pointer"
                                        }}
                                        title={flavor}
                                      >
                                        {initials}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ verticalAlign: "top", padding: "1rem", textAlign: "center" }}>
                          <div>
                            <div style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                              <strong>{item.pax} pax</strong>
                            </div>
                            <div style={{ fontSize: "1rem", marginBottom: "0.5rem", color: "#666" }}>
                              RM {item.pricePerBox}/box
                            </div>
                            <div style={{ fontSize: "1.2rem", color: "#2d5aa0", marginBottom: "0.5rem" }}>
                              <strong>Total: RM {item.total}</strong>
                            </div>
                            {item.budgetMessage && (
                              <div style={{ fontSize: "0.8rem", color: "#e74c3c", fontStyle: "italic" }}>
                                {item.budgetMessage}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Regenerate button (when table is shown) */}
              <div className="button-container">
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="regenerate-btn"
                  style={{
                    opacity: isGenerating ? 0.6 : 1,
                    cursor: isGenerating ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isGenerating ? 'Regenerating...' : 'Regenerate Suggestions'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default B2BOrderFixed;