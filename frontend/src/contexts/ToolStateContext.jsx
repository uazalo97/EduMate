import React, { createContext, useContext, useState } from 'react';

const ToolStateContext = createContext();

export function ToolStateProvider({ children }) {
  // Trạng thái (state) toàn cục của công cụ Soạn Giáo Án
  const [lessonPlanState, setLessonPlanState] = useState({
    step: 'SELECT_TEMPLATE',
    selectedTemplateId: null,
    selectedTemplateName: '',
    prompt: '',
    truong: '',
    to: '',
    giaoVien: '',
    lop: '',
    monHoc: '',
    tenBaiDay: '',
    soTiet: '',
    isConfigCollapsed: false,
    resultBlob: null,
    resultBlobUrl: null,
    selectionData: null,
    inlineEditMode: null, // null | 'ai' | 'manual'
    editPrompt: '',
    isEditingDocument: false,
    manualEditText: ''
  });

  // Hàm để cập nhật một phần state (giống setState dạng object)
  const updateLessonPlanState = (updates) => {
    setLessonPlanState(prev => ({ ...prev, ...updates }));
  };

  return (
    <ToolStateContext.Provider value={{ lessonPlanState, updateLessonPlanState }}>
      {children}
    </ToolStateContext.Provider>
  );
}

// Hook tùy chỉnh để sử dụng dễ dàng ở mọi nơi
export function useToolState() {
  return useContext(ToolStateContext);
}
