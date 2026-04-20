'use client';

import { useEffect } from 'react';
import { engine } from '@/lib/engine/EngineService';

export default function EngineInitializer() {
  useEffect(() => {
    const initEngine = async () => {
      try {
        await engine.init();
        
        // Basic ping test to verify the bridge
        const stats = engine.getStats();
        console.log('[Engine] Bridge Verified. Stats:', stats);
        
        const testRender = engine.render(42);
        console.log('[Engine] Render Test:', testRender);
        
      } catch (err) {
        console.error('[Engine] Initialization failed:', err);
      }
    };

    initEngine();
  }, []);

  return null; // This component doesn't render anything
}
