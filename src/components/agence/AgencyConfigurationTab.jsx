import React from 'react';
import AgencyConfigurationContainer from './AgencyConfigurationContainer';

// Wrapper to maintain backward compatibility if imported elsewhere directly
// but mostly redirects to the new container.
export default function AgencyConfigurationTab(props) {
  return <AgencyConfigurationContainer {...props} />;
}