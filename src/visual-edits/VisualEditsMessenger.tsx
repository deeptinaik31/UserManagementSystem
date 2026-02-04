"use client";

import { useEffect } from "react";

export default function VisualEditsMessenger() {
  useEffect(() => {
    let visualEditMode = false;
    let selectionLocked = false; // 🔒 Track if element selection is locked
    let lockedElement: HTMLElement | null = null; // Track which element is locked

    // Highlight overlay with enhanced styling
    const overlay = document.createElement("div");
    overlay.style.position = "absolute";
    overlay.style.pointerEvents = "none";
    overlay.style.border = "2px solid #0070f3";
    overlay.style.background = "rgba(0, 112, 243, 0.1)";
    overlay.style.zIndex = "999999";
    overlay.style.display = "none";
    overlay.style.transition = "all 0.1s ease";
    overlay.style.boxShadow = "0 0 0 1px rgba(0, 112, 243, 0.3)";

    const label = document.createElement("div");
    label.style.position = "absolute";
    label.style.top = "-1.5rem";
    label.style.left = "0";
    label.style.padding = "4px 8px";
    label.style.fontSize = "11px";
    label.style.fontFamily = "system-ui, -apple-system, sans-serif";
    label.style.fontWeight = "500";
    label.style.background = "#0070f3";
    label.style.color = "#fff";
    label.style.borderRadius = "4px";
    label.style.whiteSpace = "nowrap";
    label.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
    overlay.appendChild(label);
    document.body.appendChild(overlay);

    // Helper: Get highlight colors based on element type
    const getHighlightColor = (elementType: string) => {
      switch (elementType) {
        case 'form':
          return { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', shadow: 'rgba(239, 68, 68, 0.3)' }; // Red
        case 'icon':
          return { border: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)', shadow: 'rgba(168, 85, 247, 0.3)' }; // Purple
        case 'container':
          return { border: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', shadow: 'rgba(107, 114, 128, 0.3)' }; // Gray
        case 'interactive':
          return { border: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', shadow: 'rgba(16, 185, 129, 0.3)' }; // Green
        case 'media':
          return { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', shadow: 'rgba(245, 158, 11, 0.3)' }; // Amber
        default:
          return { border: '#0070f3', bg: 'rgba(0, 112, 243, 0.1)', shadow: 'rgba(0, 112, 243, 0.3)' }; // Blue
      }
    };

    // Helper: Check if element has icon classes
    const hasIconClass = (el: HTMLElement): boolean => {
      const className = el.getAttribute('class') || '';
      return /icon|svg-inline|fa-|lucide-/.test(className);
    };

    // Helper: Detect element type dynamically
    const detectElementType = (el: HTMLElement): {
      type: 'form' | 'icon' | 'container' | 'text' | 'interactive' | 'media';
      subType?: string;
      isEditable: boolean;
    } => {
      const tag = el.tagName.toLowerCase();
      
      // Form elements
      if (['form', 'input', 'select', 'textarea'].includes(tag)) {
        return { type: 'form', subType: tag, isEditable: false };
      }
      
      // Label is editable text in forms
      if (tag === 'label') {
        return { type: 'form', subType: 'label', isEditable: true };
      }
      
      // Icons (SVG or image with icon class)
      if (tag === 'svg' || (tag === 'img' && hasIconClass(el))) {
        return { type: 'icon', isEditable: false };
      }
      
      // Media elements
      if (['img', 'video', 'audio', 'iframe', 'picture'].includes(tag)) {
        return { type: 'media', subType: tag, isEditable: false };
      }
      
      // Interactive elements
      if (['button', 'a'].includes(tag)) {
        return { type: 'interactive', subType: tag, isEditable: true };
      }
      
      // Text elements (headings, paragraphs)
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'li', 'blockquote', 'code', 'pre'].includes(tag)) {
        return { type: 'text', subType: tag, isEditable: true };
      }
      
      // Container elements (has multiple child elements)
      const childElements = Array.from(el.children);
      const hasMultipleChildren = childElements.length > 1;
      const hasFormFields = childElements.some(child => 
        ['input', 'select', 'textarea', 'button'].includes(child.tagName.toLowerCase())
      );
      
      if (hasMultipleChildren || hasFormFields) {
        return { type: 'container', isEditable: false };
      }
      
      // Default to text element (might have single child or just text)
      return { type: 'text', isEditable: true };
    };

    // Helper: Extract only direct editable text (not nested form fields or containers)
    const extractEditableText = (el: HTMLElement, elementInfo: ReturnType<typeof detectElementType>): {
      text: string;
      hasEditableText: boolean;
    } => {
      const { type, isEditable } = elementInfo;
      
      // Forms, icons, media, and containers should not show nested text
      if (!isEditable || type === 'container') {
        return { text: '', hasEditableText: false };
      }
      
      // For editable elements, get direct text nodes only (not nested elements)
      let directText = '';
      let hasDirectTextNodes = false;
      
      for (const child of Array.from(el.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent?.trim() || '';
          if (text) {
            directText += text + ' ';
            hasDirectTextNodes = true;
          }
        }
      }
      
      directText = directText.trim();
      
      // If no direct text nodes but element is editable, use textContent as fallback
      // but only if it doesn't have form fields as children
      if (!hasDirectTextNodes && isEditable) {
        const hasFormChildren = Array.from(el.children).some(child =>
          ['input', 'select', 'textarea'].includes(child.tagName.toLowerCase())
        );
        
        if (!hasFormChildren) {
          const textContent = el.textContent?.trim() || '';
          return {
            text: textContent,
            hasEditableText: textContent.length > 0
          };
        }
      }
      
      return {
        text: directText,
        hasEditableText: directText.length > 0
      };
    };

    const highlight = (target: HTMLElement, name: string, elementType?: string) => {
      const rect = target.getBoundingClientRect();
      const type = elementType || 'text';
      const colors = getHighlightColor(type);
      
      overlay.style.display = "block";
      overlay.style.top = `${rect.top + window.scrollY}px`;
      overlay.style.left = `${rect.left + window.scrollX}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      overlay.style.border = `2px solid ${colors.border}`;
      overlay.style.background = colors.bg;
      overlay.style.boxShadow = `0 0 0 1px ${colors.shadow}`;
      
      // Show element info in label with type indicator
      const tagName = target.tagName.toLowerCase();
      const displayName = name || tagName;
      const typeEmoji = {
        form: '📝',
        icon: '🎨',
        container: '📦',
        interactive: '🔘',
        media: '🖼️',
        text: '📄'
      }[type] || '📄';
      
      label.textContent = `${typeEmoji} <${displayName}>`;
      label.style.background = colors.border;
    };
    
    const hideHighlight = () => {
      overlay.style.display = "none";
    };

    // Show locked state (keep highlight with amber color)
    const showLockedHighlight = (target: HTMLElement, name: string) => {
      const rect = target.getBoundingClientRect();
      
      overlay.style.display = "block";
      overlay.style.top = `${rect.top + window.scrollY}px`;
      overlay.style.left = `${rect.left + window.scrollX}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      overlay.style.border = "2px solid #f59e0b";
      overlay.style.background = "rgba(245, 158, 11, 0.1)";
      overlay.style.boxShadow = "0 0 0 1px rgba(245, 158, 11, 0.3)";
      
      // Keep label visible with locked color
      const tagName = target.tagName.toLowerCase();
      const displayName = name || tagName;
      label.textContent = `🔒 <${displayName}>`;
      label.style.background = "#f59e0b";
    };

    const hideLockedHighlight = () => {
      overlay.style.display = "none";
    };

    // Utility → find nearest component with data-appopen-id
    const findComponentEl = (el: HTMLElement | null): HTMLElement | null => {
      while (el && el !== document.body) {
        if (el.hasAttribute("data-appopen-id")) return el;
        el = el.parentElement;
      }
      return null;
    };

    // Helper to get all computed styles comprehensively for all design panel sections
    const getCaptureAllStyles = (computed: CSSStyleDeclaration): Record<string, string> => {
      return {
        // 📝 Content & Typography
        color: computed.color,
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        fontStyle: computed.fontStyle,
        lineHeight: computed.lineHeight,
        letterSpacing: computed.letterSpacing,
        wordSpacing: computed.wordSpacing,
        textAlign: computed.textAlign,
        textTransform: computed.textTransform,
        textDecoration: computed.textDecoration,
        textIndent: computed.textIndent,
        textShadow: computed.textShadow,
        whiteSpace: computed.whiteSpace,
        wordBreak: computed.wordBreak,
        overflowWrap: computed.overflowWrap,
        
        // 🎨 Background & Colors
        backgroundColor: computed.backgroundColor,
        backgroundImage: computed.backgroundImage,
        backgroundSize: computed.backgroundSize,
        backgroundPosition: computed.backgroundPosition,
        backgroundRepeat: computed.backgroundRepeat,
        backgroundAttachment: computed.backgroundAttachment,
        backgroundClip: computed.backgroundClip,
        backgroundOrigin: computed.backgroundOrigin,
        
        // 🖼️ Borders (comprehensive)
        border: computed.border,
        borderWidth: computed.borderWidth,
        borderStyle: computed.borderStyle,
        borderColor: computed.borderColor,
        borderRadius: computed.borderRadius,
        borderTopWidth: computed.borderTopWidth,
        borderRightWidth: computed.borderRightWidth,
        borderBottomWidth: computed.borderBottomWidth,
        borderLeftWidth: computed.borderLeftWidth,
        borderTopStyle: computed.borderTopStyle,
        borderRightStyle: computed.borderRightStyle,
        borderBottomStyle: computed.borderBottomStyle,
        borderLeftStyle: computed.borderLeftStyle,
        borderTopColor: computed.borderTopColor,
        borderRightColor: computed.borderRightColor,
        borderBottomColor: computed.borderBottomColor,
        borderLeftColor: computed.borderLeftColor,
        borderTopLeftRadius: computed.borderTopLeftRadius,
        borderTopRightRadius: computed.borderTopRightRadius,
        borderBottomLeftRadius: computed.borderBottomLeftRadius,
        borderBottomRightRadius: computed.borderBottomRightRadius,
        
        // 📦 Spacing (comprehensive)
        margin: computed.margin,
        marginTop: computed.marginTop,
        marginRight: computed.marginRight,
        marginBottom: computed.marginBottom,
        marginLeft: computed.marginLeft,
        padding: computed.padding,
        paddingTop: computed.paddingTop,
        paddingRight: computed.paddingRight,
        paddingBottom: computed.paddingBottom,
        paddingLeft: computed.paddingLeft,
        
        // 📐 Layout & Display
        display: computed.display,
        width: computed.width,
        height: computed.height,
        maxWidth: computed.maxWidth,
        maxHeight: computed.maxHeight,
        minWidth: computed.minWidth,
        minHeight: computed.minHeight,
        overflow: computed.overflow,
        overflowX: computed.overflowX,
        overflowY: computed.overflowY,
        
        // 🔀 Flexbox
        flexDirection: computed.flexDirection,
        flexWrap: computed.flexWrap,
        flexFlow: computed.flexFlow,
        justifyContent: computed.justifyContent,
        alignItems: computed.alignItems,
        alignContent: computed.alignContent,
        alignSelf: computed.alignSelf,
        flex: computed.flex,
        flexGrow: computed.flexGrow,
        flexShrink: computed.flexShrink,
        flexBasis: computed.flexBasis,
        gap: computed.gap,
        rowGap: computed.rowGap,
        columnGap: computed.columnGap,
        order: computed.order,
        
        // 📍 Position
        position: computed.position,
        top: computed.top,
        right: computed.right,
        bottom: computed.bottom,
        left: computed.left,
        zIndex: computed.zIndex,
        inset: computed.inset,
        
        // ✨ Effects & Transforms
        opacity: computed.opacity,
        boxShadow: computed.boxShadow,
        filter: computed.filter,
        backdropFilter: computed.backdropFilter,
        transform: computed.transform,
        transformOrigin: computed.transformOrigin,
        transition: computed.transition,
        animation: computed.animation,
        cursor: computed.cursor,
        pointerEvents: computed.pointerEvents,
        userSelect: computed.userSelect,
        
        // 🔗 Outline
        outline: computed.outline,
        outlineWidth: computed.outlineWidth,
        outlineStyle: computed.outlineStyle,
        outlineColor: computed.outlineColor,
        outlineOffset: computed.outlineOffset,
        
        // 🎯 Grid (for future support)
        gridTemplateColumns: computed.gridTemplateColumns,
        gridTemplateRows: computed.gridTemplateRows,
        gridTemplateAreas: computed.gridTemplateAreas,
        gridAutoColumns: computed.gridAutoColumns,
        gridAutoRows: computed.gridAutoRows,
        gridAutoFlow: computed.gridAutoFlow,
        gridColumn: computed.gridColumn,
        gridRow: computed.gridRow,
        gridArea: computed.gridArea,
        
        // 📏 Box Model
        boxSizing: computed.boxSizing,
        aspectRatio: computed.aspectRatio,
        objectFit: computed.objectFit,
        objectPosition: computed.objectPosition,
        
        // 🎪 Visibility
        visibility: computed.visibility,
        clipPath: computed.clipPath,
        mixBlendMode: computed.mixBlendMode,
      };
    };

    // Helper: Detect if element is inside a mapped array (multiple elements with same data-appopen-id)
    const detectArrayContext = (el: HTMLElement, id: string): {
      isInArray: boolean;
      arrayIndex: number;
      totalItems: number;
      siblingKey: string | null;
    } => {
      // Find all elements with the same data-appopen-id
      const sameIdElements = document.querySelectorAll(`[data-appopen-id="${id}"]`);
      const totalItems = sameIdElements.length;
      
      if (totalItems <= 1) {
        return { isInArray: false, arrayIndex: -1, totalItems: 1, siblingKey: null };
      }
      
      // Find the index of the current element
      let arrayIndex = -1;
      sameIdElements.forEach((siblingEl, idx) => {
        if (siblingEl === el) {
          arrayIndex = idx;
        }
      });
      
      // Try to find a key attribute (React uses this for list items)
      // Also check parent element for key context
      let siblingKey: string | null = null;
      
      // Look for key-like attributes on the element or its ancestors
      let keyEl: HTMLElement | null = el;
      while (keyEl && !siblingKey) {
        siblingKey = keyEl.getAttribute('data-key') || 
                     keyEl.getAttribute('data-id') ||
                     keyEl.getAttribute('data-index');
        keyEl = keyEl.parentElement;
      }
      
      return {
        isInArray: true,
        arrayIndex,
        totalItems,
        siblingKey
      };
    };

    // Selection click with comprehensive data capture
    const handleClick = (e: MouseEvent) => {
      if (!visualEditMode) return;
      if (selectionLocked) {
        console.log('⚠️ Selection is locked - cannot select new element');
        return; // 🔒 Block selection if locked
      }
      const el = findComponentEl(e.target as HTMLElement);
      if (!el) return;

      const id = el.getAttribute("data-appopen-id");
      const name = el.getAttribute("data-appopen-name") || el.tagName.toLowerCase();

      e.preventDefault();
      e.stopPropagation();

      const computed = getComputedStyle(el);
      
      // Detect element type dynamically
      const elementInfo = detectElementType(el);
      
      // Extract editable text smartly
      const textInfo = extractEditableText(el, elementInfo);
      
      // Capture ALL styles using comprehensive helper
      const styles = getCaptureAllStyles(computed);

      // Capture all attributes comprehensively
      const attributes: Record<string, string> = {};
      Array.from(el.attributes).forEach((attr) => {
        if (!attr.name.startsWith("data-appopen-")) {
          // Convert 'class' to 'className' for JSX compatibility
          const attrName = attr.name === 'class' ? 'className' : attr.name;
          attributes[attrName] = attr.value;
        }
      });

      // 🔄 Detect if element is inside a mapped array
      const arrayContext = id ? detectArrayContext(el, id) : {
        isInArray: false,
        arrayIndex: -1,
        totalItems: 1,
        siblingKey: null
      };

      console.log('📤 [MESSENGER] Sending element data:', {
        id,
        name,
        tagName: el.tagName.toLowerCase(),
        elementType: elementInfo.type,
        isEditable: elementInfo.isEditable,
        hasTextContent: textInfo.hasEditableText,
        textLength: textInfo.text.length,
        styleCount: Object.keys(styles).length,
        attributeCount: Object.keys(attributes).length,
        childElementCount: el.children.length,
        // Array context info
        isInArray: arrayContext.isInArray,
        arrayIndex: arrayContext.arrayIndex,
        totalItems: arrayContext.totalItems,
      });

      window.parent.postMessage(
        {
          type: "ELEMENT_SELECTED",
          payload: {
            id,
            name,
            text: textInfo.text,
            styles,
            attributes,
            tagName: el.tagName.toLowerCase(),
            selector: getSelector(el),
            hasTextContent: textInfo.hasEditableText,
            // Enhanced context-aware data
            elementType: elementInfo.type,
            elementSubType: elementInfo.subType,
            isEditable: elementInfo.isEditable,
            childElementCount: el.children.length,
            hasFormFields: Array.from(el.children).some(child =>
              ['input', 'select', 'textarea'].includes(child.tagName.toLowerCase())
            ),
            // 🔄 Array/Map context - critical for proper editing of mapped elements
            isInArray: arrayContext.isInArray,
            arrayIndex: arrayContext.arrayIndex,
            totalItems: arrayContext.totalItems,
            siblingKey: arrayContext.siblingKey,
          },
        },
        "*"
      );
    };

    // Helper to generate CSS selector for debugging (FIX: Handle SVG className)
    const getSelector = (el: HTMLElement): string => {
      if (el.id) return `#${el.id}`;
      
      // Safely get className (works for both HTML and SVG elements)
      const classAttr = el.getAttribute('class');
      if (classAttr) {
        const classes = classAttr.split(' ').filter(c => c && !c.startsWith('data-'));
        if (classes.length > 0) return `.${classes.join('.')}`;
      }
      
      return el.tagName.toLowerCase();
    };

    // Hover highlight
    const handleMouseMove = (e: MouseEvent) => {
      if (!visualEditMode) return;
      if (selectionLocked) {
        // Keep locked highlight visible, don't hide
        return;
      }
      const el = findComponentEl(e.target as HTMLElement);
      if (el) {
        const id = el.getAttribute("data-appopen-id");
        const name = el.getAttribute("data-appopen-name") || el.tagName.toLowerCase();
        if (id) {
          const elementInfo = detectElementType(el);
          highlight(el, name, elementInfo.type);
        }
      } else {
        hideHighlight();
      }
    };

    // Handle messages from editor with enhanced update logic
    const handleMessage = (event: MessageEvent) => {
      const { type, payload, enabled } = event.data || {};

      if (type === "VISUAL_EDIT_MODE") {
        visualEditMode = !!enabled;
        if (!visualEditMode) {
          hideHighlight();
          selectionLocked = false;
          lockedElement = null;
        }
        console.log(`🎨 [MESSENGER] Visual edit mode: ${visualEditMode ? 'ON' : 'OFF'}`);
        return;
      }

      // 🔒 Handle selection lock/unlock
      if (type === "LOCK_SELECTION") {
        console.log('🔒 [MESSENGER] Selection locked - element editing in progress');
        selectionLocked = true;
        
        // Find the locked element and show locked highlight
        if (payload?.id) {
          const el = document.querySelector(`[data-appopen-id="${payload.id}"]`) as HTMLElement;
          if (el) {
            lockedElement = el;
            const name = el.getAttribute("data-appopen-name") || el.tagName.toLowerCase();
            showLockedHighlight(el, name);
          }
        }
        return;
      }

      if (type === "UNLOCK_SELECTION") {
        console.log('🔓 [MESSENGER] Selection unlocked - ready for new selection');
        selectionLocked = false;
        lockedElement = null;
        hideLockedHighlight();
        return;
      }

      if (!payload?.id) {
        console.warn('[MESSENGER] No element ID provided in payload');
        return;
      }
      
      const el = document.querySelector(`[data-appopen-id="${payload.id}"]`) as HTMLElement;
      if (!el) {
        console.warn(`[MESSENGER] Element with id ${payload.id} not found`);
        return;
      }

      // ✏️ UPDATE TEXT - Smart text node handling
      if (type === "UPDATE_TEXT") {
        console.log('✏️ [MESSENGER] Updating text:', { id: payload.id, newText: payload.newText?.substring(0, 50) });
        
        const newText = payload.newText || '';
        const childElements = Array.from(el.children);
        
        // Strategy: Find all text nodes and replace them with new text
        // Preserve non-text nodes (icons, spans, etc.)
        
        if (childElements.length === 0) {
          // Simple case: no child elements, just set text content
          el.textContent = newText;
          console.log('✅ [MESSENGER] Set textContent directly (no children)');
          return;
        }
        
        // Has child elements (icons, badges, nested spans, etc.)
        // Find all text nodes (both empty and non-empty)
        const textNodes: Text[] = [];
        for (const child of Array.from(el.childNodes)) {
          if (child.nodeType === Node.TEXT_NODE) {
            textNodes.push(child as Text);
          }
        }
        
        if (textNodes.length > 0) {
          // Update the first text node with new text, clear the rest
          textNodes[0].textContent = newText;
          for (let i = 1; i < textNodes.length; i++) {
            textNodes[i].textContent = '';
          }
          console.log(`✅ [MESSENGER] Updated ${textNodes.length} text node(s)`);
        } else {
          // No text nodes exist, create one
          // Determine where to insert: after first child element (icon) or at end
          const firstElement = childElements[0];
          if (firstElement) {
            // Insert after first element (e.g., icon)
            el.insertBefore(document.createTextNode(' ' + newText), firstElement.nextSibling);
            console.log('✅ [MESSENGER] Added text node after first child');
          } else {
            // Fallback: append at end
            el.appendChild(document.createTextNode(newText));
            console.log('✅ [MESSENGER] Appended text node');
          }
        }
        return;
      }
      
      // 🎨 UPDATE STYLE - Comprehensive style updates
      if (type === "UPDATE_STYLE") {
        console.log('🎨 [MESSENGER] Updating styles:', { 
          id: payload.id, 
          styleCount: Object.keys(payload.styles || {}).length,
          styles: payload.styles 
        });
        
        Object.entries(payload.styles || {}).forEach(([key, value]) => {
          try {
            // Handle special cases
            if (value === null || value === undefined || value === '') {
              // Remove the style property (convert camelCase to kebab-case)
              const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
              el.style.removeProperty(kebabKey);
            } else {
              // Special handling for fontFamily - load Google Fonts dynamically
              if (key === 'fontFamily') {
                // Extract first font from value (remove quotes and get first font)
                const firstFont = String(value).split(',')[0].trim().replace(/^['"]|['"]$/g, '');
                
                // List of system fonts that don't need loading
                const systemFonts = [
                  'Arial', 'Helvetica', 'Times New Roman', 'Times', 'Courier New', 'Courier',
                  'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
                  'Trebuchet MS', 'Impact', 'sans-serif', 'serif', 'monospace', 'cursive', 
                  'fantasy', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI'
                ];
                
                const isSystemFont = systemFonts.some(sf => 
                  firstFont.toLowerCase() === sf.toLowerCase()
                );
                
                // Load Google Font if not a system font and not already loaded
                if (!isSystemFont) {
                  const fontId = `gf-${firstFont.replace(/\s+/g, '-')}`;
                  const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(firstFont).replace(/%20/g, '+')}:wght@300;400;500;600;700;800;900&display=swap`;
                  
                  // Check if font is already loaded by ID or URL
                  if (!document.getElementById(fontId) && !document.querySelector(`link[href="${fontUrl}"]`)) {
                    const link = document.createElement('link');
                    link.id = fontId;
                    link.rel = 'stylesheet';
                    link.href = fontUrl;
                    document.head.appendChild(link);
                    console.log(`🔤 [MESSENGER] Loading Google Font: ${firstFont}`);
                  } else {
                    console.log(`🔤 [MESSENGER] Google Font already loaded: ${firstFont}`);
                  }
                }
              }
              
              // Set the style property
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (el.style as any)[key] = value;
              console.log(`✅ [MESSENGER] Set style ${key}: ${String(value).substring(0, 50)}`);
            }
          } catch (error) {
            console.warn(`[MESSENGER] Failed to set style ${key}:`, error);
          }
        });
        
        console.log('✅ [MESSENGER] Styles updated successfully');
        return;
      }
      
      // 🏷️ UPDATE TAG - Change HTML tag (e.g., H1 to H2)
      if (type === "UPDATE_TAG") {
        const newTagName = payload.tagName?.toLowerCase();
        
        if (!newTagName) {
          console.warn('[MESSENGER] No tagName provided for UPDATE_TAG');
          return;
        }
        
        console.log('🏷️ [MESSENGER] Changing tag:', { 
          id: payload.id, 
          from: el.tagName.toLowerCase(),
          to: newTagName 
        });
        
        // Don't change if same tag
        if (el.tagName.toLowerCase() === newTagName) {
          console.log('⏭️ [MESSENGER] Tag is already', newTagName);
          return;
        }
        
        try {
          // Create the new element
          const newEl = document.createElement(newTagName);
          
          // Copy all attributes (including data-appopen-id)
          Array.from(el.attributes).forEach(attr => {
            newEl.setAttribute(attr.name, attr.value);
          });
          
          // Copy all inline styles
          newEl.style.cssText = el.style.cssText;
          
          // Copy all child nodes (preserves text, icons, nested elements)
          while (el.firstChild) {
            newEl.appendChild(el.firstChild);
          }
          
          // Replace the element in the DOM
          el.parentNode?.replaceChild(newEl, el);
          
          // Update locked element reference if this was the locked element
          if (lockedElement === el) {
            lockedElement = newEl;
            const name = newEl.getAttribute("data-appopen-name") || newEl.tagName.toLowerCase();
            showLockedHighlight(newEl, name);
          }
          
          console.log('✅ [MESSENGER] Tag changed successfully from', el.tagName.toLowerCase(), 'to', newTagName);
          
          // Send confirmation back to parent with new element info
          window.parent.postMessage({
            type: "TAG_UPDATED",
            payload: {
              id: payload.id,
              oldTag: el.tagName.toLowerCase(),
              newTag: newTagName,
              success: true
            }
          }, "*");
          
        } catch (error) {
          console.error('[MESSENGER] Failed to change tag:', error);
          window.parent.postMessage({
            type: "TAG_UPDATED",
            payload: {
              id: payload.id,
              success: false,
              error: String(error)
            }
          }, "*");
        }
        return;
      }

      // 🔄 RESET_STYLES - Remove ALL inline styles to restore element to original state
      if (type === "RESET_STYLES") {
        console.log('🔄 [MESSENGER] Resetting all styles for element:', payload.id);
        
        try {
          // Remove ALL inline styles by clearing the style attribute completely
          el.removeAttribute('style');
          
          console.log('✅ [MESSENGER] All inline styles removed - element restored to original CSS state');
          
          // Get the new computed styles after reset
          const computed = getComputedStyle(el);
          const newStyles = getCaptureAllStyles(computed);
          
          // Send confirmation back to parent with the restored styles
          window.parent.postMessage({
            type: "STYLES_RESET",
            payload: {
              id: payload.id,
              success: true,
              styles: newStyles // Send back the computed styles after reset
            }
          }, "*");
          
        } catch (error) {
          console.error('[MESSENGER] Failed to reset styles:', error);
          window.parent.postMessage({
            type: "STYLES_RESET",
            payload: {
              id: payload.id,
              success: false,
              error: String(error)
            }
          }, "*");
        }
        return;
      }

      // 🏷️ UPDATE ATTRIBUTE - Enhanced attribute handling
      if (type === "UPDATE_ATTRIBUTE") {
        console.log('🏷️ [MESSENGER] Updating attributes:', { 
          id: payload.id, 
          attributeCount: Object.keys(payload.attributes || {}).length,
          attributes: payload.attributes 
        });
        
        Object.entries(payload.attributes || {}).forEach(([key, value]) => {
          try {
            const strValue = String(value);
            
            // Skip empty values for most attributes (but allow empty for some like alt)
            const allowEmptyValue = ['alt', 'title', 'placeholder'].includes(key);
            if (!strValue && !allowEmptyValue) {
              console.log(`⏭️ [MESSENGER] Skipping empty value for ${key}`);
              return;
            }
            
            // Handle src attribute - works for img, video, audio, iframe, source, embed
            if (key === 'src') {
              el.setAttribute('src', strValue);
              // Force reload for images
              if (el.tagName === 'IMG') {
                // Trigger image reload by briefly clearing and resetting
                const img = el as HTMLImageElement;
                const currentSrc = img.src;
                if (currentSrc !== strValue) {
                  img.src = '';
                  setTimeout(() => { img.src = strValue; }, 10);
                }
              }
              console.log(`✅ [MESSENGER] Set src: ${strValue.substring(0, 50)}...`);
              return;
            }
            
            // Handle href attribute - works for a, link, area
            if (key === 'href') {
              el.setAttribute('href', strValue);
              console.log(`✅ [MESSENGER] Set href: ${strValue.substring(0, 50)}...`);
              return;
            }
            
            // Handle alt text for images
            if (key === 'alt') {
              el.setAttribute('alt', strValue);
              console.log('✅ [MESSENGER] Set alt text');
              return;
            }
            
            // Handle title attribute (universal)
            if (key === 'title') {
              el.setAttribute('title', strValue);
              console.log('✅ [MESSENGER] Set title attribute');
              return;
            }
            
            // Handle target attribute for links
            if (key === 'target') {
              el.setAttribute('target', strValue);
              console.log(`✅ [MESSENGER] Set target: ${strValue}`);
              return;
            }
            
            // Handle rel attribute for links
            if (key === 'rel') {
              el.setAttribute('rel', strValue);
              console.log(`✅ [MESSENGER] Set rel: ${strValue}`);
              return;
            }
            
            // Handle type attribute for buttons/inputs
            if (key === 'type') {
              el.setAttribute('type', strValue);
              console.log(`✅ [MESSENGER] Set type: ${strValue}`);
              return;
            }
            
            // Handle disabled attribute
            if (key === 'disabled') {
              if (strValue === 'true' || strValue === 'disabled') {
                el.setAttribute('disabled', 'disabled');
                (el as HTMLButtonElement | HTMLInputElement).disabled = true;
              } else {
                el.removeAttribute('disabled');
                (el as HTMLButtonElement | HTMLInputElement).disabled = false;
              }
              console.log(`✅ [MESSENGER] Set disabled: ${strValue}`);
              return;
            }
            
            // Handle placeholder for inputs
            if (key === 'placeholder') {
              el.setAttribute('placeholder', strValue);
              console.log('✅ [MESSENGER] Set placeholder');
              return;
            }
            
            // Handle className specially
            if (key === 'className') {
              el.className = strValue;
              console.log('✅ [MESSENGER] Set className');
              return;
            }
            
            // Handle id attribute
            if (key === 'id') {
              el.id = strValue;
              console.log('✅ [MESSENGER] Set id');
              return;
            }
            
            // Handle data-* attributes
            if (key.startsWith('data-') && !key.startsWith('data-appopen-')) {
              el.setAttribute(key, strValue);
              console.log(`✅ [MESSENGER] Set data attribute: ${key}`);
              return;
            }
            
            // Handle aria-* attributes
            if (key.startsWith('aria-')) {
              el.setAttribute(key, strValue);
              console.log(`✅ [MESSENGER] Set ARIA attribute: ${key}`);
              return;
            }
            
            // Skip internal appopen attributes
            if (key.startsWith('data-appopen-')) {
              return;
            }
            
            // Generic fallback for any other attribute
            el.setAttribute(key, strValue);
            console.log(`✅ [MESSENGER] Set attribute: ${key} = ${strValue.substring(0, 30)}`);
            
          } catch (error) {
            console.warn(`[MESSENGER] Failed to set attribute ${key}:`, error);
          }
        });
        
        console.log('✅ [MESSENGER] Attributes updated successfully');
        return;
      }

      console.warn(`[MESSENGER] Unknown message type: ${type}`);
    };

    window.addEventListener("mousemove", handleMouseMove, true);
    window.addEventListener("click", handleClick, true);
    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove, true);
      window.removeEventListener("click", handleClick, true);
      window.removeEventListener("message", handleMessage);
      overlay.remove();
    };
  }, []);

  return null;
}
