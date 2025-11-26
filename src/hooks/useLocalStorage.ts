import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
    // Get initial value
    const readValue = (): T => {
        if (typeof window === 'undefined') {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    };

    const [storedValue, setStoredValue] = useState<T>(readValue);

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
                // Dispatch a custom event so other hooks with the same key can update
                window.dispatchEvent(new CustomEvent('local-storage', { detail: { key, value: valueToStore } }));
            }
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    };

    useEffect(() => {
        setStoredValue(readValue());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent | CustomEvent) => {
            if ((e as StorageEvent).key === key || (e as CustomEvent).detail?.key === key) {
                setStoredValue(readValue());
            }
        };

        window.addEventListener('storage', handleStorageChange as EventListener);
        window.addEventListener('local-storage', handleStorageChange as EventListener);

        return () => {
            window.removeEventListener('storage', handleStorageChange as EventListener);
            window.removeEventListener('local-storage', handleStorageChange as EventListener);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    return [storedValue, setValue];
}
