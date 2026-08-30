from openai import OpenAI
client = OpenAI(api_key="enter your api key here ")
max_completion_tokens = 100
response =client.completion.chat.create(
    model = "gpt-4o-mini",
    message = [{"role": "user" , "content": "give your pronmpt "}],
    max_completion_tokens = 100 

)

print(response.client.choices[0].message.content)