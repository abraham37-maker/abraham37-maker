import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  BadgeCheck,
  BookOpen,
  Gamepad2,
  Lock,
  MessageCircle,
  Sparkles,
  Star,
  Volume2,
} from 'lucide-react'

const LEVEL_CAP = 10
const XP_PER_LEVEL = 100

const initialGames = [
  {
    id: 'word-hunt',
    label: 'Chasse aux mots',
    icon: BookOpen,
    level: 1,
    description: 'Traduis des mots arabes en français avec des indices créatifs.',
  },
  {
    id: 'gender-lab',
    label: 'Labo du genre',
    icon: Sparkles,
    level: 2,
    description: 'Choisis “Le” ou “La” pour des mots piégeux.',
  },
  {
    id: 'verb-master',
    label: 'Maître des verbes',
    icon: Gamepad2,
    level: 3,
    description: 'Complète des phrases avec “être” ou “avoir”.',
  },
]

const wordHuntCards = [
  {
    arabic: 'كتاب',
    answer: 'livre',
    hint: 'Imagine un livre qui s’ouvre comme باب كبير.',
  },
  {
    arabic: 'مدينة',
    answer: 'ville',
    hint: 'C’est l’endroit où les rues se croisent comme un souk.',
  },
  {
    arabic: 'قهوة',
    answer: 'café',
    hint: 'Ça sent la cardamome et les cafés parisiens.',
  },
]

const genderLabCards = [
  {
    word: 'lune',
    arabic: 'القمر',
    answer: 'La',
    hint: 'En français, la lune est féminine comme نجمة.',
  },
  {
    word: 'soleil',
    arabic: 'الشمس',
    answer: 'Le',
    hint: 'Le soleil a une énergie masculine ici.',
  },
  {
    word: 'musique',
    arabic: 'موسيقى',
    answer: 'La',
    hint: 'La musique danse comme رقصة.',
  },
]

const verbMasterCards = [
  {
    sentence: 'Je ____ un étudiant curieux.',
    answer: 'être',
    hint: 'Parle de ce que tu es, pas de ce que tu possèdes.',
  },
  {
    sentence: 'Nous ____ deux objectifs aujourd’hui.',
    answer: 'avoir',
    hint: 'On parle de possession, comme عندنا.',
  },
  {
    sentence: 'Elle ____ prête pour la mission.',
    answer: 'être',
    hint: 'C’est un état, مثل هو/هي.',
  },
]

const avatarWaves = [0, 1, 2]

const speakWithTts = async (text) => {
  // Placeholder for TTS integration. Connect to your TTS endpoint here.
  return text
}

const pcmToWav = (pcmBuffer) => {
  // Placeholder for PCM -> WAV conversion for streaming playback.
  return pcmBuffer
}

const requestTutorReply = async (prompt, name) => {
  // Placeholder for LLM (Gemini 2.5 Flash) API call.
  return `Super ${name} ! ${prompt} est une belle piste. Pense à relier ça à une image arabe pour t'aider.`
}

const getLevelFromXp = (xp) =>
  Math.min(LEVEL_CAP, Math.floor(xp / XP_PER_LEVEL) + 1)

const getLevelProgress = (xp) => {
  if (xp >= XP_PER_LEVEL * LEVEL_CAP) {
    return 100
  }
  return (xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100
}

const IndexPage = () => {
  const [stage, setStage] = useState('welcome')
  const [name, setName] = useState('')
  const [inputName, setInputName] = useState('')
  const [xp, setXp] = useState(20)
  const [level, setLevel] = useState(1)
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentGame, setCurrentGame] = useState(null)
  const [gameIndex, setGameIndex] = useState(0)
  const [gameInput, setGameInput] = useState('')
  const [gameFeedback, setGameFeedback] = useState('')

  const chatRef = useRef(null)
  const audioRef = useRef(null)

  const progress = useMemo(() => getLevelProgress(xp), [xp])

  useEffect(() => {
    setLevel(getLevelFromXp(xp))
  }, [xp])

  useEffect(() => {
    if (!isSpeaking) {
      return
    }
    const timer = setTimeout(() => setIsSpeaking(false), 1600)
    return () => clearTimeout(timer)
  }, [isSpeaking])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (stage === 'orientation') {
      const greet = `Enchanté ${name} ! Je suis Synthesis Tutor. Ensemble on suit une série de 3 jours pour booster ton français.`
      setMessages([
        {
          id: 'welcome-1',
          sender: 'ai',
          text: `${greet} Choisis une activité pour commencer, je suis prêt à te guider.`,
        },
      ])
      setIsSpeaking(true)
    }
  }, [stage, name])

  useEffect(() => {
    if (stage === 'chat') {
      setMessages((prev) =>
        prev.length
          ? prev
          : [
              {
                id: 'chat-hello',
                sender: 'ai',
                text: `Salut ${name} ! Parlons comme deux amis dans un café. Raconte-moi ta journée, je te guide sans te donner la réponse directe.`,
              },
            ]
      )
      setIsSpeaking(true)
    }
  }, [stage, name])

  const addXp = (amount) => {
    setXp((prev) => Math.min(prev + amount, XP_PER_LEVEL * LEVEL_CAP))
  }

  const handleStart = () => {
    if (!inputName.trim()) {
      return
    }
    const trimmed = inputName.trim()
    setName(trimmed)
    setStage('orientation')
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim()) {
      return
    }
    const userText = chatInput.trim()
    const id = `user-${Date.now()}`
    setMessages((prev) => [...prev, { id, sender: 'user', text: userText }])
    setChatInput('')

    const reply = await requestTutorReply(userText, name)
    setMessages((prev) => [
      ...prev,
      {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `${reply} Bravo ${name}, continue !`,
      },
    ])
    setIsSpeaking(true)
    addXp(10)

    const spoken = await speakWithTts(reply)
    if (audioRef.current && spoken) {
      audioRef.current.dataset.last = spoken
    }
  }

  const enterGame = (gameId) => {
    setCurrentGame(gameId)
    setStage('game')
    setGameIndex(0)
    setGameInput('')
    setGameFeedback('')
  }

  const handleGameSubmit = (overrideInput) => {
    if (!currentGame) {
      return
    }

    const response = overrideInput ?? gameInput
    const normalized = response.trim().toLowerCase()
    let card
    if (currentGame === 'word-hunt') {
      card = wordHuntCards[gameIndex]
    } else if (currentGame === 'gender-lab') {
      card = genderLabCards[gameIndex]
    } else {
      card = verbMasterCards[gameIndex]
    }

    if (!normalized) {
      setGameFeedback(`Allez ${name}, tente quelque chose, même une intuition !`)
      return
    }

    const correct = normalized === card.answer.toLowerCase()

    if (correct) {
      setGameFeedback(
        `Super ${name} ! Tu avances comme un chef d’orchestre. On passe à la suite.`
      )
      addXp(15)
      setGameInput('')
      setGameIndex((prev) => (prev + 1) % (currentGame === 'word-hunt'
        ? wordHuntCards.length
        : currentGame === 'gender-lab'
        ? genderLabCards.length
        : verbMasterCards.length))
    } else {
      setGameFeedback(`Pas encore ${name}. Indice : ${card.hint}`)
      addXp(4)
    }
  }

  const gameCard = useMemo(() => {
    if (!currentGame) {
      return null
    }
    if (currentGame === 'word-hunt') {
      return wordHuntCards[gameIndex]
    }
    if (currentGame === 'gender-lab') {
      return genderLabCards[gameIndex]
    }
    return verbMasterCards[gameIndex]
  }, [currentGame, gameIndex])

  const games = useMemo(
    () =>
      initialGames.map((game) => ({
        ...game,
        locked: level < game.level,
      })),
    [level]
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 font-sans">
      <audio ref={audioRef} className="hidden" />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-200">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Synthesis Tutor</p>
              <p className="text-lg font-semibold">Niveau {level}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">{name ? `Élève: ${name}` : 'En attente du prénom'}</p>
            <p className="text-xs text-slate-500">XP: {xp} / {LEVEL_CAP * XP_PER_LEVEL}</p>
          </div>
        </div>
        <div className="mx-auto w-full max-w-5xl px-6 pb-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-300 progress-glow transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8">
        {stage === 'welcome' && (
          <section className="fade-in rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="flex flex-col gap-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-200">
                <Sparkles className="h-10 w-10" />
              </div>
              <h1 className="text-3xl font-semibold">
                Bienvenue ! Quel est ton prénom ?
              </h1>
              <p className="text-slate-300">
                Je suis prêt à transformer le français en aventure, comme un voyage entre Paris et Marrakech.
              </p>
              <div className="mx-auto flex w-full max-w-md flex-col gap-4">
                <input
                  type="text"
                  value={inputName}
                  onChange={(event) => setInputName(event.target.value)}
                  placeholder="Ton prénom..."
                  className="rounded-2xl border border-white/20 bg-slate-900/70 px-5 py-3 text-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="button"
                  onClick={handleStart}
                  className="rounded-2xl bg-indigo-500 px-6 py-3 text-lg font-semibold text-white transition hover:bg-indigo-400"
                >
                  C&apos;est parti !
                </button>
              </div>
            </div>
          </section>
        )}

        {stage !== 'welcome' && (
          <section className="grid gap-6 md:grid-cols-[280px_1fr]">
            <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex flex-col items-center gap-5 text-center">
                <div className="relative">
                  <div className="orbit-ring absolute inset-0 rounded-full border border-indigo-400/30" />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-100">
                    <BadgeCheck className="h-10 w-10" />
                  </div>
                </div>
                <div>
                  <p className="text-sm uppercase text-slate-400">Tuteur IA</p>
                  <h2 className="text-xl font-semibold">Synthesis Tutor</h2>
                  <p className="text-sm text-slate-300">
                    {name}, je t’accompagne avec curiosité et bienveillance.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-slate-900/70 px-4 py-2 text-sm text-slate-200">
                  <Volume2 className="h-4 w-4" />
                  Voix prête (TTS)
                </div>
                <div className="grid w-full gap-3">
                  <button
                    type="button"
                    onClick={() => setStage('chat')}
                    className="rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-3 text-left text-sm transition hover:border-indigo-400/60"
                  >
                    Discussion guidée
                    <p className="text-xs text-slate-400">Dialogue en bulles et conseils doux.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStage('orientation')}
                    className="rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-3 text-left text-sm transition hover:border-indigo-400/60"
                  >
                    Menu d&apos;orientation
                    <p className="text-xs text-slate-400">Choisis ton activité favorite.</p>
                  </button>
                </div>
              </div>
            </aside>

            <div className="flex flex-col gap-6">
              {stage === 'orientation' && (
                <section className="fade-in rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                  <h3 className="text-2xl font-semibold">Phase d&apos;orientation</h3>
                  <p className="mt-2 text-slate-300">
                    {messages[0]?.text}
                  </p>
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {games.map((game) => {
                      const Icon = game.icon
                      return (
                        <button
                          key={game.id}
                          type="button"
                          disabled={game.locked}
                          onClick={() => enterGame(game.id)}
                          className={`rounded-3xl border border-white/10 bg-slate-900/60 p-4 text-left transition hover:border-indigo-400/70 ${game.locked ? 'opacity-60' : 'hover:-translate-y-1'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-200">
                              <Icon className="h-5 w-5" />
                            </div>
                            {game.locked && (
                              <div className="flex items-center gap-1 text-xs text-slate-400">
                                <Lock className="h-3 w-3" />
                                Niveau {game.level}
                              </div>
                            )}
                          </div>
                          <h4 className="mt-4 text-lg font-semibold">{game.label}</h4>
                          <p className="mt-2 text-sm text-slate-400">{game.description}</p>
                        </button>
                      )
                    })}
                  </div>
                </section>
              )}

              {stage === 'chat' && (
                <section className="fade-in flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 backdrop-blur">
                  <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-5 w-5 text-indigo-200" />
                      <h3 className="text-lg font-semibold">Discussion immersive</h3>
                    </div>
                    {isSpeaking && (
                      <div className="flex items-end gap-1">
                        {avatarWaves.map((wave) => (
                          <span
                            key={wave}
                            className="wave-bar h-4 w-1 rounded-full bg-indigo-300"
                            style={{ animationDelay: `${wave * 0.2}s` }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div ref={chatRef} className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow ${
                            message.sender === 'user'
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-900/70 text-slate-100'
                          }`}
                        >
                          {message.text}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/10 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(event) => setChatInput(event.target.value)}
                        placeholder={`Dis-moi quelque chose, ${name}...`}
                        className="flex-1 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                      <button
                        type="button"
                        onClick={handleSendMessage}
                        className="rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
                      >
                        Envoyer
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {stage === 'game' && gameCard && (
                <section className="fade-in rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-semibold">{games.find((game) => game.id === currentGame)?.label}</h3>
                      <p className="text-slate-300">
                        {games.find((game) => game.id === currentGame)?.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStage('orientation')}
                      className="rounded-2xl border border-white/20 bg-slate-900/60 px-4 py-2 text-sm text-slate-200 transition hover:border-indigo-400/70"
                    >
                      Retour menu
                    </button>
                  </div>

                  <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/50 p-6">
                    {currentGame === 'word-hunt' && (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-400">Mot arabe</p>
                        <p className="text-3xl font-semibold">{gameCard.arabic}</p>
                        <p className="text-sm text-slate-300">Traduis ce mot en français.</p>
                      </div>
                    )}
                    {currentGame === 'gender-lab' && (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-400">Genre grammatical</p>
                        <p className="text-2xl font-semibold">
                          {gameCard.word} <span className="text-slate-400">({gameCard.arabic})</span>
                        </p>
                        <p className="text-sm text-slate-300">Choisis entre “Le” ou “La”.</p>
                      </div>
                    )}
                    {currentGame === 'verb-master' && (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-400">Complétion</p>
                        <p className="text-2xl font-semibold">{gameCard.sentence}</p>
                        <p className="text-sm text-slate-300">Utilise “être” ou “avoir”.</p>
                      </div>
                    )}

                    <div className="mt-6 flex flex-col gap-3 md:flex-row">
                      {currentGame === 'gender-lab' ? (
                        ['Le', 'La'].map((choice) => (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => handleGameSubmit(choice)}
                            className="flex-1 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-indigo-400/70"
                          >
                            {choice}
                          </button>
                        ))
                      ) : currentGame === 'verb-master' ? (
                        ['être', 'avoir'].map((choice) => (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => handleGameSubmit(choice)}
                            className="flex-1 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-indigo-400/70"
                          >
                            {choice}
                          </button>
                        ))
                      ) : (
                        <>
                          <input
                            type="text"
                            value={gameInput}
                            onChange={(event) => setGameInput(event.target.value)}
                            placeholder="Ta réponse..."
                            className="flex-1 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                          <button
                            type="button"
                            onClick={handleGameSubmit}
                            className="rounded-2xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
                          >
                            Valider
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {gameFeedback && (
                    <div className="mt-4 rounded-2xl border border-indigo-400/40 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-100">
                      {gameFeedback}
                    </div>
                  )}
                </section>
              )}

              {stage === 'orientation' && (
                <section className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
                  <h4 className="text-lg font-semibold">Conseil du jour</h4>
                  <p className="mt-2 text-sm text-slate-300">
                    {name}, imagine que le genre en français est comme la couleur d&apos;un mot en arabe :
                    il faut l&apos;écouter et le sentir avant de le dire.
                  </p>
                </section>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default IndexPage
