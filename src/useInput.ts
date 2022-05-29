import { useState } from 'react';

const useInput = () => {
  const [text, setText] = useState<string>('');
  return { text, setText };
};

export default useInput;
