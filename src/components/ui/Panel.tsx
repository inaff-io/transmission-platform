interface PanelProps {
  children: React.ReactNode;
}

interface PanelHeaderProps {
  children: React.ReactNode;
}

interface PanelTitleProps {
  children: React.ReactNode;
}

interface PanelDescriptionProps {
  children: React.ReactNode;
}

interface PanelContentProps {
  children: React.ReactNode;
}

function PanelRoot({ children }: PanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {children}
    </div>
  );
}

function PanelHeader({ children }: PanelHeaderProps) {
  return (
    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      {children}
    </div>
  );
}

function PanelTitle({ children }: PanelTitleProps) {
  return (
    <h3 className="text-lg font-medium leading-6 text-gray-900">
      {children}
    </h3>
  );
}

function PanelDescription({ children }: PanelDescriptionProps) {
  return (
    <p className="mt-1 text-sm text-gray-500">
      {children}
    </p>
  );
}

function PanelContent({ children }: PanelContentProps) {
  return (
    <div className="px-6 py-4">
      {children}
    </div>
  );
}

export const Panel = Object.assign(PanelRoot, {
  Header: PanelHeader,
  Title: PanelTitle,
  Description: PanelDescription,
  Content: PanelContent,
});