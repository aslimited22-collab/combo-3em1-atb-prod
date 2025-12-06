"use client"

import { useState, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"

export default function Home() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState("idle") // idle, loading, success, error
  const [numerology, setNumerology] = useState(null)
  const { toast } = useToast()

  const handleValidation = async (e: FormEvent) => {
    e.preventDefault()
    setStatus("loading")
  
    try {
      const response = await fetch("/api/validar-acesso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })
  
      const data = await response.json()
  
      console.log("🔍 Response Status:", response.status)
      console.log("🔍 Response OK:", response.ok)
      console.log("🔍 data.acesso:", data.acesso)
  
      if (response.ok && data.acesso) {
        console.log("✅ SUCESSO! Redirecionando para /produto")
        // Redireciona para a página do produto com o email na URL
        window.location.href = `/produto?email=${encodeURIComponent(email)}`
      } else {
        console.log("❌ NEGADO!")
        setStatus("error")
        toast({
          title: "Erro de Validação",
          description: data.message || "Email não encontrado ou inválido",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ ERRO NO CATCH:", error)
      setStatus("error")
      toast({
        title: "Erro de Rede",
        description: "Não foi possível conectar ao servidor. Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Sua Numerologia</CardTitle>
            <CardDescription>Bem-vindo, {email}!</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Aqui estará o conteúdo da sua numerologia.</p>
            {/* You can display the numerology data here */}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <Toaster />
.
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Acesse sua Numerologia</CardTitle>
          <CardDescription>Digite o e-mail que você usou na compra.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleValidation} className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Input
                id="email"
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={status === "loading"}>
              {status === "loading" ? "Validando..." : "Acessar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
