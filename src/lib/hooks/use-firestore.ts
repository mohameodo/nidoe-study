"use client"

import { useState, useEffect, useMemo } from 'react'
import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  DocumentData,
  QueryConstraint,
  DocumentReference,
  CollectionReference,
  Query
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

// Type for the document with ID
export type FirestoreDoc<T> = T & { id: string }

// States for data fetching
export type FetchState<T> = {
  data: T[] | null
  loading: boolean
  error: Error | null
}

export type SingleDocState<T> = {
  data: T | null
  loading: boolean
  error: Error | null
}

/**
 * Hook to get real-time updates from a Firestore collection
 */
export function useCollection<T = DocumentData>(
  path: string,
  constraints: QueryConstraint[] = [],
  deps: any[] = []
): FetchState<FirestoreDoc<T>> {
  const [state, setState] = useState<FetchState<FirestoreDoc<T>>>({
    data: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    setState(prev => ({ ...prev, loading: true }))
    
    const collectionRef = collection(db, path)
    const queryRef = constraints.length 
      ? query(collectionRef, ...constraints) 
      : query(collectionRef)
    
    const unsubscribe = onSnapshot(
      queryRef,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FirestoreDoc<T>[]
        
        setState({
          data,
          loading: false,
          error: null
        })
      },
      (error) => {
        console.error(`Error fetching collection ${path}:`, error)
        setState({
          data: null,
          loading: false,
          error
        })
      }
    )
    
    return () => unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  
  return state
}

/**
 * Hook to get real-time updates from a Firestore document
 */
export function useDocument<T = DocumentData>(
  path: string,
  id: string | null | undefined,
  deps: any[] = []
): SingleDocState<FirestoreDoc<T>> {
  const [state, setState] = useState<SingleDocState<FirestoreDoc<T>>>({
    data: null,
    loading: true,
    error: null
  })
  
  useEffect(() => {
    // Return early if no ID
    if (!id) {
      setState({
        data: null,
        loading: false,
        error: null
      })
      return () => {}
    }
    
    setState(prev => ({ ...prev, loading: true }))
    
    const docRef = doc(db, path, id)
    
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = {
            id: snapshot.id,
            ...snapshot.data()
          } as FirestoreDoc<T>
          
          setState({
            data,
            loading: false,
            error: null
          })
        } else {
          setState({
            data: null,
            loading: false,
            error: new Error(`Document ${id} does not exist in ${path}`)
          })
        }
      },
      (error) => {
        console.error(`Error fetching document ${path}/${id}:`, error)
        setState({
          data: null,
          loading: false,
          error
        })
      }
    )
    
    return () => unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, id, ...deps])
  
  return state
}

/**
 * Hook to get real-time updates from a user's documents
 */
export function useUserCollection<T = DocumentData>(
  path: string,
  userId: string | null | undefined,
  additionalConstraints: QueryConstraint[] = [],
  deps: any[] = []
): FetchState<FirestoreDoc<T>> {
  // Use useMemo to prepare constraints
  const constraints = useMemo(() => {
    return userId 
      ? [where("userId", "==", userId), ...additionalConstraints] 
      : additionalConstraints
  }, [userId, additionalConstraints]);

  // Use a memory state to determine if we should actually fetch
  const shouldFetch = !!userId;
  
  // Always call useCollection, but handle the empty state
  const result = useCollection<T>(path, constraints, [userId, shouldFetch, ...deps]);
  
  // If we shouldn't fetch, return empty state
  if (!shouldFetch) {
    return { data: null, loading: false, error: null };
  }
  
  return result;
} 