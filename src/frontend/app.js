const dietaryPlanData = [
  {
    time: "Breakfast",
    icon: "sunrise",
    dishName: "Oats Idli with Sambhar (No added salt)",
    macros: {
      calories: "280 kcal",
      protein: "10g",
      fats: "4g"
    },
    dashMetrics: {
      sodium: "120mg",
      fiber: "8g"
    },
    dashScore: "9.2/10"
  },
  {
    time: "Lunch",
    icon: "sun",
    dishName: "Palak Dal & Brown Rice + Cucumber Raita",
    macros: {
      calories: "450 kcal",
      protein: "16g",
      fats: "8g"
    },
    dashMetrics: {
      sodium: "250mg",
      fiber: "14g"
    },
    dashScore: "8.8/10"
  },
  {
    time: "Dinner",
    icon: "moon",
    dishName: "Multigrain Roti with Lauki Sabzi + Salad",
    macros: {
      calories: "320 kcal",
      protein: "9g",
      fats: "5g"
    },
    dashMetrics: {
      sodium: "180mg",
      fiber: "10g"
    },
    dashScore: "9.5/10"
  }
];

function renderMealPlan() {
  const container = document.getElementById("meal-plan-container");
  
  if (!container) return;

  const html = dietaryPlanData.map(meal => {
    return `
      <div class="meal-section">
        <div class="meal-time">
          <i data-lucide="${meal.icon}" style="width: 20px; height: 20px;"></i>
          ${meal.time}
        </div>
        
        <div class="card meal-card">
          <div class="meal-header">
            <div>
              <h3 class="dish-name">${meal.dishName}</h3>
            </div>
            <div class="dash-score">
              <i data-lucide="shield-check" style="width: 16px; height: 16px;"></i>
              Score: ${meal.dashScore}
            </div>
          </div>
          
          <div class="pills-container">
            <div class="pill">
              🔥
              <span class="pill-value">${meal.macros.calories}</span>
            </div>
            <div class="pill">
              🍗 Protein:
              <span class="pill-value">${meal.macros.protein}</span>
            </div>
            <div class="pill">
              🥑 Fat:
              <span class="pill-value">${meal.macros.fats}</span>
            </div>
          </div>
          
          <div class="dash-metrics">
            <div class="dash-metric-item">
              <div class="dash-metric-label">Sodium</div>
              <div class="dash-metric-value">${meal.dashMetrics.sodium}</div>
              <div style="font-size: 0.75rem; color: var(--success-color);">Low risk</div>
            </div>
            <div class="dash-metric-item" style="border-left: 1px dashed #bfdbfe; padding-left: 2rem;">
              <div class="dash-metric-label">Fiber</div>
              <div class="dash-metric-value">${meal.dashMetrics.fiber}</div>
              <div style="font-size: 0.75rem; color: var(--success-color);">Optimal</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  container.innerHTML = html;
  
  // Re-initialize lucide icons for dynamically added content
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Render the UI when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  renderMealPlan();
});
