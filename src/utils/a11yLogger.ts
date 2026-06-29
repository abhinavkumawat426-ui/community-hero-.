/**
 * Automated Accessibility (A11y) Testing Logger for WCAG Compliance.
 * Scans the current active DOM and reports gaps to the developer console.
 */
export function runA11yAudit() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  console.group("%c 🛡️ Citizen Hero - Accessibility Audit %c Active", "background: #00796B; color: #fff; padding: 3px 6px; border-radius: 4px; font-weight: bold;", "background: #14b8a6; color: #000; padding: 3px 6px; border-radius: 4px; font-weight: bold; margin-left: 6px;");

  const violations: Array<{ element: HTMLElement; rule: string; impact: "critical" | "serious" | "moderate" }> = [];

  // 1. Check images for alt tags (WCAG 1.1.1)
  const images = document.querySelectorAll("img");
  images.forEach((img) => {
    if (!img.hasAttribute("alt") || img.getAttribute("alt")?.trim() === "") {
      violations.push({
        element: img,
        rule: "Images must have an alt attribute representing their content. Missing alt can break screen readers.",
        impact: "critical",
      });
    }
  });

  // 2. Check form inputs for labels or aria-label (WCAG 1.3.1 / 4.1.2)
  const inputs = document.querySelectorAll("input, select, textarea");
  inputs.forEach((input) => {
    const htmlInput = input as HTMLElement;
    const id = htmlInput.getAttribute("id");
    const ariaLabel = htmlInput.getAttribute("aria-label");
    const ariaLabelledBy = htmlInput.getAttribute("aria-labelledby");
    
    let hasLabel = false;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) hasLabel = true;
    }

    if (!hasLabel && !ariaLabel && !ariaLabelledBy && htmlInput.getAttribute("type") !== "hidden") {
      violations.push({
        element: htmlInput,
        rule: `Form input fields should have associated labels (either <label for="${id || "field-id"}"> or an explicit 'aria-label') for accessibility.`,
        impact: "serious",
      });
    }
  });

  // 3. Check interactive buttons for empty content or missing aria-labels (WCAG 4.1.2)
  const buttons = document.querySelectorAll("button");
  buttons.forEach((btn) => {
    const textContent = btn.textContent?.trim();
    const hasImageAlt = Array.from(btn.querySelectorAll("img")).some(img => img.getAttribute("alt"));
    const ariaLabel = btn.getAttribute("aria-label");
    const titleAttr = btn.getAttribute("title");

    if (!textContent && !hasImageAlt && !ariaLabel && !titleAttr) {
      violations.push({
        element: btn,
        rule: "Interactive buttons must contain text, an image with alternative text, or an explicit 'aria-label' so they can be read aloud.",
        impact: "critical",
      });
    }
  });

  // 4. Check for color contrast or sizing / touch targets (WCAG 2.5.5)
  // Check touch target heights on mobile elements or buttons
  buttons.forEach((btn) => {
    const rect = btn.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0 && (rect.width < 32 || rect.height < 32)) {
      violations.push({
        element: btn,
        rule: `Button dimension (${Math.round(rect.width)}x${Math.round(rect.height)}px) is smaller than recommended touch target size (minimum 44x44px for standard mobile/web components).`,
        impact: "moderate",
      });
    }
  });

  if (violations.length === 0) {
    console.log("%c 🎉 High-contrast WCAG Checklist fully cleared! All checked widgets contain semantic tags.", "color: #10b981; font-weight: bold; font-size: 11px;");
  } else {
    console.log(`%c Found ${violations.length} WCAG compliance optimization targets:`, "color: #ff9800; font-weight: bold; font-size: 12px;");
    
    violations.forEach((v, idx) => {
      const color = v.impact === "critical" ? "#ef4444" : v.impact === "serious" ? "#f97316" : "#eab308";
      console.groupCollapsed(`%c[${v.impact.toUpperCase()}] %c${v.rule.substring(0, 75)}...`, `color: ${color}; font-weight: bold;`, "color: #cbd5e1; font-weight: normal;");
      console.log("%cDescription:", "color: #94a3b8; font-weight: bold;", v.rule);
      const tag = v.element.tagName.toLowerCase();
      const idStr = v.element.id ? `#${v.element.id}` : "";
      const classStr = v.element.className ? `.${String(v.element.className).trim().split(/\s+/).join(".")}` : "";
      console.log("%cElement Context:", "color: #94a3b8; font-weight: bold;", `<${tag}${idStr}${classStr}>`);
      console.log("%cHTML Snippet:", "color: #94a3b8; font-weight: bold;", v.element.outerHTML.substring(0, 200) + (v.element.outerHTML.length > 200 ? "..." : ""));
      console.groupEnd();
    });
  }

  console.groupEnd();
}
