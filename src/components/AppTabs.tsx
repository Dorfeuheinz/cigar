import { Tabs, TabsProps } from "flowbite-react";
import { useState } from "react";
import React from "react";

function AppTabs(props: TabsProps) {
  const [currentlyVisibleTab, setCurrentlyVisibleTab] = useState(0);

  const handleTabChange = (tabIndex: number) => {
    setCurrentlyVisibleTab(tabIndex);
  };

  return (
    <Tabs onActiveTabChange={handleTabChange} {...props}>
      {React.Children.map(props.children, (child, index) => {
        if (index !== currentlyVisibleTab) {
          return child;
        } else {
          return child;
        }
      })}
    </Tabs>
  );
}

export default AppTabs;
