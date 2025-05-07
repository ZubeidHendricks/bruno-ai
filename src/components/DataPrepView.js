import React from 'react';
import TabNav from './TabNav';
import FileInfoBar from './FileInfoBar';
import ChatInput from './ChatInput';
import AIInterpretation from './AIInterpretation';
import PreviewSection from './PreviewSection';
import DataTable from './DataTable';

function DataPrepView() {
  return (
    <div>
      <TabNav />
      <FileInfoBar />
      <div className="p-6">
        <ChatInput />
        <AIInterpretation />
        <PreviewSection />
        <DataTable />
      </div>
    </div>
  );
}

export default DataPrepView;
