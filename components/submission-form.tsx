"use client";

import { ChangeEvent, DragEvent, FormEvent, useEffect, useState, useTransition } from "react";

type DogDraft = {
  file: File | null;
  name: string;
};

type FormState = {
  error: string | null;
  success: {
    dogCount: number;
    householdName: string | null;
    message: string;
    totalDachshunds: number;
  } | null;
};

type SubmissionApiResponse = {
  code?: string;
  dogCount?: number;
  error?: string;
  householdName?: string | null;
  message?: string;
  totalDachshunds?: number;
};

const MAX_DACHSHUND_COUNT = 5;
const COUNT_OPTIONS = [0, 1, 2, 3, 4, 5];

function createDogDrafts(count: number, previous: DogDraft[] = []) {
  return Array.from({ length: count }, (_, index) => ({
    file: previous[index]?.file ?? null,
    name: previous[index]?.name ?? "",
  }));
}

function createEmptyFormState(): FormState {
  return { error: null, success: null };
}

function getSubmitErrorMessage(status: number, payload?: SubmissionApiResponse) {
  const fallbackError =
    status === 413
      ? "That photo is too large. Please use a file under 4 MB."
      : payload?.code === "missing_env"
        ? "The server is missing a required setting. Please try again later."
        : payload?.code === "upload_failed"
          ? "We couldn't upload that photo right now. Please try again."
          : payload?.code === "db_failed"
            ? "We couldn't save that entry right now. Please try again."
            : "We couldn't save that entry.";

  return payload?.error ?? fallbackError;
}

async function readSubmissionResponse(response: Response): Promise<SubmissionApiResponse | undefined> {
  const raw = await response.text();

  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as SubmissionApiResponse;
  } catch {
    return undefined;
  }
}

function buildSubmissionFormData(householdName: string, count: number, dogs: DogDraft[]) {
  const formData = new FormData();
  formData.set("householdName", householdName);
  formData.set("dachshundCount", String(count));

  dogs.forEach((dog, index) => {
    formData.set(`dogName-${index}`, dog.name.trim());

    if (dog.file) {
      formData.set(`dogPhoto-${index}`, dog.file);
    }
  });

  return formData;
}

export function SubmissionForm() {
  const [count, setCount] = useState(0);
  const [householdName, setHouseholdName] = useState("");
  const [dogs, setDogs] = useState<DogDraft[]>(() => createDogDrafts(0));
  const [state, setState] = useState<FormState>(createEmptyFormState);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [typedTotal, setTypedTotal] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setDogs((current) => createDogDrafts(count, current));
  }, [count]);

  useEffect(() => {
    if (!state.success) {
      setTypedTotal(0);
      return;
    }

    setTypedTotal(0);
    const target = state.success.totalDachshunds;
    const stepDelay = target > 40 ? 24 : 50;
    const interval = window.setInterval(() => {
      setTypedTotal((current) => {
        if (current >= target) {
          window.clearInterval(interval);
          return target;
        }

        const remaining = target - current;
        const step = target > 60 ? Math.max(1, Math.ceil(remaining / 10)) : 1;
        return Math.min(target, current + step);
      });
    }, stepDelay);

    return () => window.clearInterval(interval);
  }, [state.success]);

  function clearFormState() {
    setState(createEmptyFormState());
  }

  function updateDog(index: number, updates: Partial<DogDraft>) {
    setDogs((current) => current.map((dog, dogIndex) => (dogIndex === index ? { ...dog, ...updates } : dog)));
  }

  function assignFile(index: number, file: File | null) {
    clearFormState();
    updateDog(index, { file });
  }

  function resetFormState() {
    setHouseholdName("");
    setCount(0);
    setDogs(createDogDrafts(0));
    setState(createEmptyFormState());
    setDragIndex(null);
    setTypedTotal(0);
  }

  function validateForm() {
    if (count < 1) {
      return "Choose at least 1 dachshund before submitting.";
    }

    for (let index = 0; index < dogs.length; index += 1) {
      if (!dogs[index]?.name.trim()) {
        return `Enter a name for Dachshund ${index + 1}.`;
      }

      if (!dogs[index]?.file) {
        return `Upload a photo for Dachshund ${index + 1}.`;
      }
    }

    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFormState();

    const validationError = validateForm();

    if (validationError) {
      setState({ error: validationError, success: null });
      return;
    }

    const formData = buildSubmissionFormData(householdName, count, dogs);

    startTransition(async () => {
      try {
        const response = await fetch("/api/submissions", {
          method: "POST",
          body: formData,
        });
        const payload = await readSubmissionResponse(response);

        if (!response.ok) {
          setState({
            error: getSubmitErrorMessage(response.status, payload),
            success: null,
          });
          return;
        }

        setState({
          error: null,
          success: {
            dogCount: payload?.dogCount ?? 0,
            householdName: payload?.householdName ?? null,
            message: payload?.message ?? "Your submission is complete.",
            totalDachshunds: payload?.totalDachshunds ?? 0,
          },
        });

        setHouseholdName("");
        setCount(0);
        setDogs(createDogDrafts(0));
        setDragIndex(null);
      } catch (error) {
        console.error(error);
        setState({
          error: "We couldn't save that entry right now. Please try again.",
          success: null,
        });
      }
    });
  }

  function handleDrop(index: number, event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragIndex(null);
    const file = event.dataTransfer.files?.[0] ?? null;

    if (file) {
      assignFile(index, file);
    }
  }

  function handleFileChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    assignFile(index, file);
  }

  if (state.success) {
    return (
      <section className="confirmationPage">
        <div className="confirmationInner">
          <h2 className="confirmationTitle">Poll is done.</h2>
          <p className="confirmationText">{state.success.message}</p>
          {state.success.householdName ? (
            <p className="confirmationMeta">Household: {state.success.householdName}</p>
          ) : null}
          <p className="confirmationCount" aria-live="polite">
            Total dachshunds counted: <span className="confirmationCountValue">{typedTotal}</span>
            <span className="typeCursor" aria-hidden="true">
              |
            </span>
          </p>
        </div>

        <button className="button buttonLarge" type="button" onClick={resetFormState}>
          Submit another household
        </button>
      </section>
    );
  }

  return (
    <form id="submission-form" className="formPanel panel" encType="multipart/form-data" onSubmit={handleSubmit}>
      <div className="fieldGrid">
        <label className="field">
          <span className="label">Owner or household name</span>
          <input
            className="input"
            name="householdName"
            maxLength={120}
            placeholder="Optional"
            value={householdName}
            onChange={(event) => {
              clearFormState();
              setHouseholdName(event.target.value);
            }}
          />
        </label>

        <label className="field">
          <span className="label">How many dachshunds do you have?</span>
          <select
            className="input"
            name="dachshundCount"
            value={count}
            onChange={(event) => {
              const nextValue = Number(event.target.value);
              clearFormState();
              setCount(Number.isNaN(nextValue) ? 0 : Math.min(MAX_DACHSHUND_COUNT, Math.max(0, nextValue)));
            }}
          >
            {COUNT_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        {dogs.map((dog, index) => (
          <div className="dogRow" key={`dog-${index}`}>
            <div className="dogHeader">
              <strong>Dachshund {index + 1}</strong>
            </div>

            <label className="field">
              <span className="label">Dachshund name</span>
              <input
                className="input"
                name={`dogName-${index}`}
                value={dog.name}
                onChange={(event) => {
                  clearFormState();
                  updateDog(index, { name: event.target.value });
                }}
                placeholder="Pickles"
                maxLength={80}
              />
            </label>

            <div className="field uploadField">
              <span className="label">Photo upload</span>
              <label
                className={`uploadZone ${dragIndex === index ? "uploadZoneActive" : ""} ${dog.file ? "uploadZoneFilled" : ""}`}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragIndex(index);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragIndex(index);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    return;
                  }
                  setDragIndex((current) => (current === index ? null : current));
                }}
                onDrop={(event) => handleDrop(index, event)}
              >
                <span className="uploadText">{dog.file ? dog.file.name : "Upload your dachshund photo"}</span>
                <span className="uploadHint">Accepted formats: JPEG, PNG, or WebP. Max size: 4 MB.</span>
                <input
                  key={`${index}-${dog.file?.name ?? "empty"}`}
                  className="fileInput"
                  name={`dogPhoto-${index}`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => handleFileChange(index, event)}
                />
              </label>
            </div>
          </div>
        ))}

        <div className="buttonRow">
          <button className="button buttonLarge" type="submit" disabled={isPending || count < 1}>
            {isPending ? "Submitting..." : "Submit"}
          </button>
        </div>

        {isPending ? <p className="hint">Please wait while we process your submission.</p> : null}
        {state.error ? <p className="errorText">{state.error}</p> : null}
      </div>
    </form>
  );
}
